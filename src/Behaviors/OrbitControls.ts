/**
 * @module
 *
 * Implements the standard orbit controls for a camera.
 *
 * See https://threejs.org/docs/#examples/en/controls/OrbitControls for more information.
 */

// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three';
// @ts-types="npm:@types/three@^0.169.0/examples/jsm/controls/OrbitControls"
import { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls.js";
import { Behavior } from "../Core/Behavior.ts";
import { ELYSIA_LOGGER } from "../Shared/Logger.ts";
import { isThreeActor } from "../Core/Component.ts";
import type { ThreeObject } from "../Actors/ThreeObject.ts";

const _q1 = new Three.Quaternion();
const _m1 = new Three.Matrix4();
const _target = new Three.Vector3();
const _position = new Three.Vector3();

class ActorAdaptor
{
	get matrix() { return this.actor.localMatrix; }
	get matrixWorld() { return this.actor.worldMatrix}
	get position() { return this.actor.position; }
	get quaternion() { return this.actor.rotation; }
	get rotation() { return this.euler.setFromQuaternion(this.quaternion) }
	get scale() { return this.actor.scale; }
	get up() { return this.actor.object3d.up; }

	euler = new Three.Euler();

	constructor(public actor: ThreeObject) {}

	lookAt(x: number | Three.Vector3, y: number, z: number) {
		if (x instanceof Three.Vector3)
		{
			_target.copy(x);
		}
		else
		{
			_target.set(x, y, z);
		}

		const parent = this.actor.parent;

		_position.setFromMatrixPosition(this.matrixWorld);

		if (this.actor.object3d instanceof Three.Camera || this.actor.object3d instanceof Three.Light)
		{
			_m1.lookAt(_position, _target, this.up);
		}
		else
		{
			_m1.lookAt(_target, _position, this.up);
		}

		this.quaternion.setFromRotationMatrix(_m1);

		if (parent) {
			_m1.extractRotation(parent.worldMatrix);
			_q1.setFromRotationMatrix(_m1);
			this.quaternion.premultiply(_q1.invert());
		}
	}

	updateMatrixWorld() {
		this.actor.updateWorldMatrix();
	}

	updateWorldMatrix() {
		this.actor.updateWorldMatrix();
	}
}

class CameraActorAdaptor extends ActorAdaptor
{
	get isOrthographicCamera() { return this.actor.object3d instanceof Three.OrthographicCamera; }
	get isPerspectiveCamera() { return this.actor.object3d instanceof Three.PerspectiveCamera; }
	get projectionMatrix() { return (this.actor.object3d as Three.PerspectiveCamera).projectionMatrix; }
	get projectionMatrixInverse() { return (this.actor.object3d as Three.PerspectiveCamera).projectionMatrixInverse; }
	get fov(){ return (this.actor.object3d as Three.PerspectiveCamera).fov; }
	set fov(value: number) { (this.actor.object3d as Three.PerspectiveCamera).fov = value; }
	get aspect() { return (this.actor.object3d as Three.PerspectiveCamera).aspect; }
	set aspect(value: number) { (this.actor.object3d as Three.PerspectiveCamera).aspect = value; }
	get near() { return (this.actor.object3d as Three.PerspectiveCamera).near; }
	set near(value: number) { (this.actor.object3d as Three.PerspectiveCamera).near = value; }
	get far() { return (this.actor.object3d as Three.PerspectiveCamera).far; }
	set far(value: number) { (this.actor.object3d as Three.PerspectiveCamera).far = value; }
	updateProjectionMatrix() {
		if (this.isPerspectiveCamera) {
			const camera = this.actor.object3d as Three.PerspectiveCamera;
			console.log("updateProjectionMatrix", camera);
			camera.updateProjectionMatrix();
		}
	}
}

/**
 * Implements the standard orbit controls for a camera.
 */
export class OrbitControls extends Behavior
{
	controls?: OrbitControlsImpl;

	/**
	 * Whether the camera should be damped smooth or not.
	 * @default false
	 */
	get smooth(): number { return this.#smooth; }
	set smooth(value: number)
	{
		if(this.controls) this.controls.enableDamping = value > 0;
		if(this.controls) this.controls.dampingFactor = value;
		this.#smooth = value;
	}

	override onCreate()
	{
		super.onCreate();
		const parent = this.parent;
		if(!isThreeActor(parent)) throw Error("OrbitControls must be attached to a ThreeObject");

		const camera = this.parent as ThreeObject<Three.Camera>;

		if(!camera)
		{
			ELYSIA_LOGGER.error("No camera found to attach orbit controls to", this.parent);
			return
		}

		const adaptor = new CameraActorAdaptor(camera) as unknown as Three.Camera

		this.controls = new OrbitControlsImpl(adaptor, this.app.renderPipeline.getRenderer().domElement);

		this.controls.enableDamping = this.#smooth > 0;
		this.controls.dampingFactor = this.#smooth;
	}

	override onUpdate()
	{
		if(this.controls)
		{
			this.controls.update();
		}
	}

	#smooth = 0.2;
}
