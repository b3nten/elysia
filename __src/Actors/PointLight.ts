/**
 * @module
 *
 * This module contains the PointLight class, which can be used to render Three.PointLights.
 * Point lights can be expensive to render, so use them sparingly.
 *
 * See Three.PointLight for more information.
 *
 * @example
 * ```ts
 * const light = new PointLight();
 * light.position.set(0, 10, 0);
 * scene.add(light);
 * ```
 */

// @ts-types="npm:@types/three@^0.169.0"
import * as Three from "three";
import { ThreeObject } from "./ThreeObject.ts";
import { isUndefined } from "../Shared/Asserts.ts";

export class PointLight extends ThreeObject<Three.PointLight> {
	get intensity(): number {
		return this.object3d.intensity;
	}
	set intensity(value: number) {
		this.object3d.intensity = value;
	}

	get color(): Three.Color {
		return this.object3d.color;
	}
	set color(value: Three.Color) {
		this.object3d.color = value;
	}

	get distance(): number {
		return this.object3d.distance;
	}
	set distance(value: number) {
		this.object3d.distance = value;
	}

	get decay(): number {
		return this.object3d.decay;
	}
	set decay(value: number) {
		this.object3d.decay = value;
	}

	get shadow(): Three.PointLightShadow {
		return this.object3d.shadow;
	}

	get power(): number {
		return this.object3d.power;
	}
	set power(value: number) {
		this.object3d.power = value;
	}

	get castShadow(): boolean {
		return this.object3d.castShadow;
	}
	set castShadow(value: boolean) {
		this.object3d.castShadow = value;
	}

	get debug(): boolean {
		return this.#debug;
	}
	set debug(value: boolean) {
		this.#debug = value;
		if (value) {
			const helper = new Three.PointLightHelper(this.object3d);
			this.object3d.add(helper);
		} else {
			const helper = this.object3d.children.find(
				(child) => child instanceof Three.PointLightHelper,
			);
			if (helper) this.object3d.remove(helper);
		}
	}

	constructor(
		color?: Three.Color,
		intensity?: number,
		distance?: number,
		decay?: number,
	) {
		super(new Three.PointLight());

		if (!isUndefined(color)) this.color = color;
		if (!isUndefined(intensity)) this.intensity = intensity;
		if (!isUndefined(distance)) this.distance = distance;
		if (!isUndefined(decay)) this.decay = decay;
	}

	#debug = false;
}
