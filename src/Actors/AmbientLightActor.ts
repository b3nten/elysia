import { Actor } from "../Scene/Actor.ts";
// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three';

/** An actor wrapping Three.AmbientLight. Setting transform properties will have no effect on this actor.n*/
export class AmbientLightActor extends Actor<Three.AmbientLight>
{
	override type: string = "AmbientLightActor";

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
		this.object3d = new Three.AmbientLight(color, intensity);
	}
}
