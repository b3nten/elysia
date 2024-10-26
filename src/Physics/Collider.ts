import { Actor } from "../Scene/Actor.ts";
import { Vector3Like } from "../Math/Vectors.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';
import Rapier from "@dimforge/rapier3d-compat";
import { findAncestorRigidbody } from "./FindAncestorRigidbody.ts";

enum ColliderType {
	Box,
	Cylinder,
	Sphere,
	Cone,
	Capsule,
	Mesh,
}

export abstract class Collider<T extends ColliderType> extends Actor
{
	override type: string = "ColliderActor";

	get mass(): number { return this.#mass; }
	set mass(mass: number)
	{
		this.#mass = mass;
		this.scene.physics?.getCollider(this)?.setMass(mass);
	}

	get density(): number { return this.#density; }
	set density(density: number)
	{
		this.#density = density;
		this.scene.physics?.getCollider(this)?.setDensity(density);
	}

	get friction(): number { return this.#friction; }
	set friction(friction: number)
	{
		this.#friction = friction;
		this.scene.physics?.getCollider(this)?.setFriction(friction);
	}

	get restitution(): number { return this.#restitution; }
	set restitution(restitution: number)
	{
		this.#restitution = restitution;
		this.scene.physics?.getCollider(this)?.setRestitution(restitution);
	}

	hasParentRigidBody = false;

	abstract readonly colliderType: ColliderType;

	abstract colliderDescriptionConstructor(worldScale: Vector3Like): Rapier.ColliderDesc;

	onCollision?(component: Collider<any>, started: boolean): void;

	onContact?(
		component: Collider<any>,
		maxForceDir: Vector3Like,
		maxForceMagnitude: number,
		totalForce: Vector3Like,
		totalForceMagnitude: number,
	): void;

	override onEnable()
	{
		this.scene?.physics!.addCollider(this);
	}

	override onDisable()
	{
		this.scene?.physics!.removeCollider(this);
	}

	override onBeforePhysicsUpdate(delta: number, elapsed: number)
	{
		const collider = this.scene.physics!.getCollider(this);
		if(!collider) return;

		if (this.hasParentRigidBody) {
			const parentRigidBody = findAncestorRigidbody(this);

			if (!parentRigidBody) return;

			const rigidBody = this.scene.physics!.getRigidBody(parentRigidBody);
			// Create matrices

			if(!rigidBody) return;

			temp.m1.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
			temp.m2.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
			temp.m3.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

			// Set rigid body's world transform
			temp.m1.compose(
				temp.v1.set(
					rigidBody.translation().x,
					rigidBody.translation().y,
					rigidBody.translation().z,
				),
				temp.q1.set(
					rigidBody.rotation().x,
					rigidBody.rotation().y,
					rigidBody.rotation().z,
					rigidBody.rotation().w,
				),
				temp.v2.set(1, 1, 1), // Assuming no scale
			);

			// Get collider s_Parent's world transform
			this.parent!.object3d.updateWorldMatrix(true, false);
			temp.m2.copy(this.parent!.object3d.matrixWorld);

			// Calculate relative transform
			temp.m3
				.copy(temp.m1)
				.invert()
				.multiply(temp.m2);

			// Extract position and rotation from the relative matrix
			temp.v3.setScalar(0); // relativePosition
			temp.q2.set(0, 0, 0, 1); // relativeQuaternion
			temp.v4.setScalar(1); // relativeScale

			temp.m3.decompose(
				temp.v3, // relativePosition
				temp.q2, // relativeQuaternion
				temp.v4, // relativeScale
			);

			// Set collider's position and rotation relative to the s_Parent rigid body
			this.scene.physics!.getCollider(this)?.setTranslationWrtParent(temp.v3);
			this.scene.physics!.getCollider(this)?.setRotationWrtParent(temp.q2);
		}

		if(!this.#previousScale.equals(
			roundVec3(this.object3d.getWorldScale(this.#temps), 2)
		))
		{
			this.#previousScale.copy(roundVec3(this.object3d.getWorldScale(this.#temps), 2));
			// remake collider because scale changed
			this.scene.physics!.addCollider(this);
			return;
		}
		collider.setRotation(this.object3d.getWorldQuaternion(this.#tempq));
		collider.setTranslation(this.object3d.getWorldPosition(this.#tempv));
	}

	#mass = 1;
	#density = 1;
	#friction = 0.5;
	#restitution = 0.5;

	#previousScale = new Three.Vector3();
	#tempq = new Three.Quaternion();
	#tempv = new Three.Vector3();
	#temps = new Three.Vector3();
}

export class BoxCollider extends Collider<ColliderType.Box>
{
	readonly colliderType = ColliderType.Box;

	colliderDescriptionConstructor(worldScale: Vector3Like): Rapier.ColliderDesc {
		return Rapier.ColliderDesc.cuboid(
			worldScale.x / 2,
			worldScale.y / 2,
			worldScale.z / 2,
		)
	}
}

export class CylinderCollider extends Collider<ColliderType.Cylinder>
{
	readonly colliderType = ColliderType.Cylinder;

	constructor(public height: number, public radius: number) {
		super();
	}

	colliderDescriptionConstructor(): Rapier.ColliderDesc {
		return Rapier.ColliderDesc.cylinder(this.height / 2, this.radius)
	}
}

export class SphereCollider extends Collider<ColliderType.Sphere>
{
	readonly colliderType = ColliderType.Sphere;

	constructor(public radius: number) {
		super();
	}

	colliderDescriptionConstructor(): Rapier.ColliderDesc {
		return Rapier.ColliderDesc.ball(this.radius)
	}
}

export class ConeCollider extends Collider<ColliderType.Cone>
{
	readonly colliderType = ColliderType.Cone;

	constructor(public height: number, public radius: number) {
		super();
	}

	colliderDescriptionConstructor(): Rapier.ColliderDesc {
		return Rapier.ColliderDesc.cone(this.height / 2, this.radius)
	}
}

export class CapsuleCollider extends Collider<ColliderType.Capsule>
{
	readonly colliderType = ColliderType.Capsule;

	constructor(public height: number, public radius: number) {
		super();
	}

	colliderDescriptionConstructor(): Rapier.ColliderDesc {
		return Rapier.ColliderDesc.capsule(this.height / 2, this.radius)
	}
}

export class MeshCollider extends Collider<ColliderType.Mesh>
{
	readonly colliderType = ColliderType.Mesh;

	constructor(public points: Float32Array | Three.BufferGeometry) {
		super();
	}

	colliderDescriptionConstructor(): Rapier.ColliderDesc {
		const worldScale = this.object3d.getWorldScale(new Three.Vector3());

		let vertices: Float32Array;
		if (this.points instanceof Float32Array) {
			vertices = this.points.slice(); // Create a copy to avoid modifying the original
		} else {
			vertices = (this.points.getAttribute("position")!.array as Float32Array).slice();
		}

		// Scale each vertex
		for (let i = 0; i < vertices.length; i += 3) {
			vertices[i] *= worldScale.x;
			vertices[i + 1] *= worldScale.y;
			vertices[i + 2] *= worldScale.z;
		}

		return Rapier.ColliderDesc.convexHull(vertices)!;
	}
}

const roundVec3 = (v: Three.Vector3, decimals: number) =>
	v.set(
		Math.round(v.x * decimals) / decimals,
		Math.round(v.y * decimals) / decimals,
		Math.round(v.z * decimals) / decimals
	)

const temp = {
	q1: new Three.Quaternion(),
	q2: new Three.Quaternion(),
	q3: new Three.Quaternion(),
	q4: new Three.Quaternion(),
	v1: new Three.Vector3(),
	v2: new Three.Vector3(),
	v3: new Three.Vector3(),
	v4: new Three.Vector3(),
	m1: new Three.Matrix4(),
	m2: new Three.Matrix4(),
	m3: new Three.Matrix4(),
	m4: new Three.Matrix4(),
};
