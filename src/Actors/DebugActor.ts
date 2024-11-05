/**
 * @module
 * An Actor that renders a debug bounding box and axis for its parent actor.
 * This actor is useful for debugging the size and position of other actors.
 *
 * @example
 * ```ts
 * const actor = new Actor();
 * actor.addComponent(new DebugActor());
 * // or
 * DebugActor.Debug(actor);
 * ```
 */

import { Actor } from "../Scene/Actor.ts";
// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three';

/** An actor that renders a debug bounding box and axis for its parent actor. */
export class DebugActor extends Actor
{
	/** Adds a debug helper to an Actor. */
	static Debug(a: Actor): DebugActor
	{
		const d = new DebugActor;
		a.addComponent(d)
		return d;
	}

	override onEnterScene()
	{
		super.onEnterScene();
		this.object3d.add(this.#debugMesh = new Three.BoxHelper(this.parent!.object3d, 0xffff00));
		this.object3d.add(this.#axis = new Three.AxesHelper(5));
	}

	override onUpdate(delta: number, elapsed: number)
	{
		super.onUpdate(delta, elapsed);
		this.#debugMesh?.update(this.parent!.object3d)
	}

	override onLeaveScene()
	{
		super.onLeaveScene()
		this.#debugMesh?.dispose();
		this.#debugMesh = undefined;
		this.#axis?.dispose();
		this.#axis = undefined;
	}

	#debugMesh?: Three.BoxHelper;
	#axis?: Three.AxesHelper;
}
