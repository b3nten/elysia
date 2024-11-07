/**
 * @module
 * An Actor wrapping Three.AmbientLight.
 * Like Three.AmbientLight, setting transform properties will have no effect on this actor.
 * See Three.AmbientLight for more information.
 *
 * @example
 * ```ts
 * const light = new AmbientLightActor(0.5, new Three.Color(0x404040));
 * scene.add(light);
 * ```
 */

// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three';
import { Actor } from "../Scene/Actor.ts";

/** An actor wrapping Three.AmbientLight. Setting transform properties will have no effect on this actor.n*/
export class AmbientLightActor extends Actor
{
	/** The intensity of the ambient light. */
	get intensity(): number { return this.object3d.intensity; }
	set intensity(value: number) { this.object3d.intensity = value; }

	/** The color of the ambient light. */
	get color(): Three.Color { return this.object3d.color; }
	set color(value: Three.Color) { this.object3d.color = value; }

	/**
	 	* Create a new AmbientLightActor.
		* @param intensity The intensity of the ambient light.
		* @param color The color of the ambient light.
	*/
	constructor(intensity?: number, color?: Three.Color)
	{
		super();
		this.object3d.intensity = intensity ?? 1;
		this.object3d.color = color ?? new Three.Color(0xFFFFFF);
	}

	override onEnterScene() {
		this.scene?.object3d.add(this.object3d);
	}

	override onLeaveScene() {
		this.scene?.object3d.remove(this.object3d);
	}

	private readonly object3d: Three.AmbientLight = new Three.AmbientLight();
}
