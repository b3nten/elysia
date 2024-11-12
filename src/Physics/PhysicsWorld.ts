// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';
import * as Rapier from "@dimforge/rapier3d-compat";
import { s_OnLoad, s_OnStart, s_OnUpdate } from "../Internal/mod.ts";
import { PhysicsDebugRenderer } from "./Debug.ts";
import { Scene } from "../Core/Scene.ts";
import { ASSERT } from "../Shared/Asserts.ts";
import { Collider } from "./Collider.ts";
import { RigidBody } from "./RigidBody.ts";
import { findAncestorRigidbody } from "./FindAncestorRigidbody.ts";
import { Actor } from "../Core/Actor.ts";
import { isActor } from "../Core/Component.ts";

interface PhysicsWorldConstructorArguments
{
	gravity?: Three.Vector3;
	debug?: boolean;
}

export class PhysicsWorld
{
	readonly gravity: Three.Vector3;

	world!: Rapier.World;

	scene!: Scene;

	constructor(args: PhysicsWorldConstructorArguments = {})
	{
		this.gravity = args.gravity ?? new Three.Vector3(0, -9.81, 0);
		this.#debugRenderer = new PhysicsDebugRenderer(args.debug);
	}

	addCollider(c: Collider<any>)
	{
		if(this.#colliders.has(c))
		{
			this.world.removeCollider(this.#colliders.get(c)!, true);
		}
		const parent = findAncestorRigidbody(c.parent);
		c.hasParentRigidBody = !!parent;
		const body = parent ? this.#rigidBodies.get(parent) : undefined;
		const desc = c.colliderDescriptionConstructor(c.object3d.getWorldScale(new Three.Vector3()));
		const collider = this.world.createCollider(desc, body);
		collider.setRotation(c.object3d.getWorldQuaternion(temp.q1));
		collider.setTranslation(c.object3d.getWorldPosition(temp.v1));
		collider.setMass(c.mass);
		collider.setDensity(c.density);
		collider.setFriction(c.friction);
		collider.setRestitution(c.restitution);
		this.#colliders.set(c, collider);
	}

	getCollider(c: Collider<any>): Rapier.Collider | undefined
	{
		return this.#colliders.get(c);
	}

	removeCollider(c: Collider<any>)
	{
		const collider = this.#colliders.get(c);
		if(!collider) return;
		this.world.removeCollider(collider, true);
		this.#colliders.delete(c);
	}

	addRigidBody(r: RigidBody)
	{
		ASSERT(r.parent)
		if(this.#rigidBodies.has(r))
		{
			this.world.removeRigidBody(this.#rigidBodies.get(r)!);
		}
		const desc = r.description
		const body = this.world.createRigidBody(desc);
		this.#rigidBodies.set(r, body);

		r.parent.object3d.getWorldPosition(temp.v1);
		body.setTranslation(temp.v1, true);
		r.parent.object3d.getWorldQuaternion(temp.q1);
		body.setRotation(temp.q1, true);

		const recurseAndRecreateColliders = (actor: Actor) =>
		{
			for(const c of actor.components)
			{
				if(c instanceof Collider) this.addCollider(c);
				if(isActor(c)) recurseAndRecreateColliders(c);
			}
		}
		recurseAndRecreateColliders(r.parent);
	}

	getRigidBody(r: RigidBody): Rapier.RigidBody | undefined
	{
		return this.#rigidBodies.get(r);
	}

	removeRigidBody(r: RigidBody)
	{
		const body = this.#rigidBodies.get(r);
		if(!body) return;
		this.world.removeRigidBody(body);
		this.#rigidBodies.delete(r);

		const recurseAndRemoveColliders = (actor: Actor) =>
		{
			for(const c of actor.components)
			{
				if(c instanceof Collider) this.removeCollider(c);
				if(isActor(c)) recurseAndRemoveColliders(c);
			}
		}
	}

	async [s_OnLoad](scene: Scene)
	{
		await Rapier.init();
		this.#queue = new Rapier.EventQueue(false);
		this.world = new Rapier.World(this.gravity);
		this.scene = scene;
	}

	[s_OnStart]()
	{
		ASSERT(this.world, "PhysicsWorld has not been initialized with a world yet.");
		ASSERT(this.scene, "PhysicsWorld has not been initialized with a scene yet.");
		this.#debugRenderer.start(this.scene.object3d, this.world);
	}

	[s_OnUpdate](d: number, e: number)
	{
		ASSERT(this.world, "PhysicsWorld has not been initialized with a world yet.");

		this.world.timestep = d;
		this.world.step(this.#queue);

		for(const [actor, body] of this.#rigidBodies)
		{
			const transform = temp.v1.copy(body.translation());
			const rotation = temp.q1.copy(body.rotation())

			if(actor.parent)
			{
				if(actor.parent.parent?.object3d)
				{
					// use parent space
					actor.parent.parent.object3d.worldToLocal(transform);
					actor.parent.position.copy(transform);
					actor.parent.parent.object3d.getWorldQuaternion(temp.q2)
					temp.q2.invert();
					rotation.premultiply(temp.q2);
					actor.parent.quaternion.copy(rotation);
				}
				else
				{
					actor.parent.object3d.position.copy(transform);
					actor.parent.object3d.quaternion.copy(rotation);
				}
			}
		}

		this.#queue!.drainCollisionEvents((handle1, handle2, started) =>
		{

		});

		this.#queue!.drainContactForceEvents((e) =>
		{

		})

		this.#queue!.clear();

		this.#debugRenderer.update();
	}

	destructor()
	{
		// @ts-ignore
		this.#debugRenderer.mesh?.dispose?.();
		this.#debugRenderer.mesh = undefined;
		this.#debugRenderer.world = undefined;
		this.world.free();
	}

	#rigidBodies = new Map<RigidBody, Rapier.RigidBody>
	#colliders = new Map<Collider<any>, Rapier.Collider>
	#queue!: Rapier.EventQueue;
	#debugRenderer: PhysicsDebugRenderer;
}

const temp = {
	v1: new Three.Vector3(),
	v2: new Three.Vector3(),
	v3: new Three.Vector3(),
	q1: new Three.Quaternion(),
	q2: new Three.Quaternion(),
	q3: new Three.Quaternion(),
}
