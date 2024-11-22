/**
 * @module
 *
 * A behavior that makes the parent object always face the camera.
 *
 * @example
 * ```ts
 * const billboard = new BillboardBehavior;
 * actor.addBehavior(billboard);
 * ```
 */

import { Behavior } from "../Core/Behavior.ts";
import { isThreeActor } from "../Core/Component.ts";
import { ThreeObject } from "../Actors/ThreeObject.ts";
// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three';

/**
 * Makes the parent object always face the camera.
 */
export class BillboardBehavior extends Behavior
{
	/**
	 * Lock the rotation on the X axis.
	 * @default false
	 */
	get lockX(): boolean { return this.#lockX }
	set lockX(value: boolean) { this.#lockX = value }

	/**
	 * Lock the rotation on the Y axis.
	 * @default false
	 */
	get lockY(): boolean { return this.#lockY }
	set lockY(value: boolean) { this.#lockY = value }

	/**
	 * Lock the rotation on the Z axis.
	 * @default false
	 */
	get lockZ(): boolean { return this.#lockZ }
	set lockZ(value: boolean) { this.#lockZ = value }

	override onCreate() {
		if(!isThreeActor(this.parent)) {
			console.warn("BillboardBehavior requires a ThreeObject parent.")
			this.#valid = false
		}
	}

	override onStart()
	{
		if(!this.#valid) return
		this.euler.setFromQuaternion((this.parent as ThreeObject).rotation)
	}

	override onUpdate(delta: number, elapsed: number)
	{
		if (!this.parent || !this.#valid) return

		const parent = this.parent as ThreeObject;

		// save previous rotation in case we're locking an axis
		const prevRotation = this.euler.clone()

		// always face the camera
		this.scene?.getActiveCamera()?.getWorldQuaternion(parent.rotation)

		// readjust any axis that is locked
		if (this.#lockX) this.euler.x = prevRotation.x
		if (this.#lockY) this.euler.y = prevRotation.y
		if (this.#lockZ) this.euler.z = prevRotation.z

		parent.rotation.setFromEuler(this.euler)
	}

	euler = new Three.Euler();

	#lockX = false
	#lockY = false
	#lockZ = false
	#valid = true;
}
