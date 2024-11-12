/**
 * @module
 * An Actor wrapping Three.DirectionalLight.
 * See Three.DirectionalLight for more information.
 *
 * @example
 * ```ts
 * const light = new DirectionalLightActor(1, new Three.Color(0xffffff));
 * scene.add(light);
 * ```
 */

// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three';
import { ThreeActor } from "./ThreeActor.ts";

/**
 * A directional light actor.
 */
export class DirectionalLightActor extends ThreeActor<Three.DirectionalLight>
{
	override object3d = new Three.DirectionalLight();
	/** The light intensity. */
	get intensity(): number { return this.object3d.intensity; }
	set intensity(value: number) { this.object3d.intensity = value; }

	/** The light color. */
	get color(): Three.Color { return this.object3d.color; }
	set color(value: Three.Color) { this.object3d.color = value; }

	/** Where the light points to. */
	get target(): Three.Object3D { return this.object3d.target; }
	set target(value: Three.Object3D) { this.object3d.target = value; }

	/**
	 * Whether the light casts shadows.
	 * @default true
	 */
	get castShadow(): boolean { return this.object3d.castShadow; }
	set castShadow(value: boolean) { this.object3d.castShadow = value; }

	/** The underlying Three.DirectionalLightShadow. */
	get shadowConfig(): Three.DirectionalLightShadow { return this.object3d.shadow; }

	/** Should the actor render a debug helper. */
	get debug(): boolean { return this.#debug; }
	set debug(value: boolean)
	{
		this.#debug = value;
		if(value)
		{
			this.#debugHelper ??= new Three.DirectionalLightHelper(this.object3d, 2, "red");
			this.object3d.add(this.#debugHelper);
		}
		else
		{
			this.#debugHelper?.parent?.remove(this.#debugHelper);
			this.#debugHelper?.dispose();
			this.#debugHelper = undefined;
		}
	}

	/**
	 * Creates a new directional light actor.
	 * @param intensity - The light intensity.
	 * @param color - The light color.
	 * @param target - Where the light points to.
	 * @param castShadow - Whether the light casts shadows.
	 */
	constructor(intensity?: number, color?: Three.Color, target?: Three.Object3D, castShadow = true)
	{
		super();
		if (target) this.object3d.target = target;
		this.castShadow = castShadow;
	}

	override onUpdate()
	{
		this.#debug && this.#debugHelper?.update();
	}

	#debug = false;
	#debugHelper?: Three.DirectionalLightHelper;
}
