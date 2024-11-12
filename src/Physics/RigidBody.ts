import { Behavior } from "../Core/Behavior.ts";
import { Vector3Like } from "../Math/Vectors.ts";
import * as Rapier from "@dimforge/rapier3d-compat";

export enum RigidbodyType {
	Static,
	Dynamic,
	KinematicVelocity,
	KinematicPosition,
}

export class RigidBody extends Behavior
{
	override type: string = "RigidBody";

	description: Rapier.RigidBodyDesc;

	get mass(): number
	{
		return this.scene?.physics?.getRigidBody(this)?.mass() ?? this.description.mass;
	}
	set mass(mass: number)
	{
		this.description.setAdditionalMass(mass);
		this.scene?.physics?.getRigidBody(this)?.setAdditionalMass(mass, true);
	}

	get linearDamping(): number
	{
		return this.scene?.physics?.getRigidBody(this)?.linearDamping() ?? this.description.linearDamping;
	}
	set linearDamping(damping: number)
	{
		this.description.setLinearDamping(damping);
		this.scene?.physics?.getRigidBody(this)?.setLinearDamping(damping);
	}

	get angularDamping(): number
	{
		return this.scene?.physics?.getRigidBody(this)?.angularDamping() ?? this.description.angularDamping;
	}
	set angularDamping(damping: number)
	{
		this.description.setAngularDamping(damping);
		this.scene?.physics?.getRigidBody(this)?.setAngularDamping(damping);
	}

	get linearVelocity(): Vector3Like
	{
		return this.scene?.physics?.getRigidBody(this)?.linvel() ?? this.#linearVelocity;
	}
	set linearVelocity(velocity: Vector3Like)
	{
		this.#linearVelocity = velocity;
		this.scene?.physics?.getRigidBody(this)?.setLinvel(velocity, true);
	}

	get angularVelocity(): Vector3Like
	{
		return this.scene?.physics?.getRigidBody(this)?.angvel() ?? this.#angularVelocity;
	}
	set angularVelocity(velocity: Vector3Like)
	{
		this.#angularVelocity = velocity;
		this.scene.physics?.getRigidBody(this)?.setAngvel(velocity, true);
	}

	get ccdEnabled(): boolean
	{
		return this.scene?.physics?.getRigidBody(this)?.isCcdEnabled() ?? this.description.ccdEnabled
	}
	set ccdEnabled(enabled: boolean)
	{
		this.description.setCcdEnabled(enabled);
		this.scene?.physics?.getRigidBody(this)?.enableCcd(enabled)
	}

	constructor(type: RigidbodyType) {
		super();
		this.#rigidBodyType = type;
		this.description = new Rapier.RigidBodyDesc(
			this.#rigidBodyType === RigidbodyType.Static
				? Rapier.RigidBodyType.Fixed
				: this.#rigidBodyType === RigidbodyType.Dynamic
					? Rapier.RigidBodyType.Dynamic
					: this.#rigidBodyType === RigidbodyType.KinematicVelocity
						? Rapier.RigidBodyType.KinematicVelocityBased
						: Rapier.RigidBodyType.KinematicPositionBased

		);
	}


	override onEnable() {
		this.scene.physics?.addRigidBody(this);
	}

	override onDisable() {
		this.scene.physics?.removeRigidBody(this);
	}

	applyImpulse(impulse: Vector3Like) {
		this.scene?.physics?.getRigidBody(this)?.applyImpulse(impulse, true);
	}

	applyForce(force: Vector3Like) {
		this.scene?.physics?.getRigidBody(this)?.addForce(force, true);
	}

	applyTorque(torque: Vector3Like) {
		this.scene?.physics?.getRigidBody(this)?.addTorque(torque, true);
	}

	#rigidBodyType: RigidbodyType = RigidbodyType.Dynamic;
	#linearVelocity = { x: 0, y: 0, z: 0 };
	#angularVelocity = { x: 0, y: 0, z: 0 };
}
