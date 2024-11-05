/**
 * @module
 *
 * This module contains the SkyActor class, which can be used to render a physical sky.
 *
 * See https://threejs.org/docs/#examples/en/objects/Skyfor more information.
 */

import { Actor } from "../Scene/Actor.ts";
// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three';
// @ts-types="npm:@types/three@^0.169.0/examples/jsm/Sky"
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { isActor } from "../Scene/Component.ts";

export const SkyDirectionalLightTag = Symbol.for("Elysia::SkyDirectionalLight");

export class SkyActor extends Actor
{
	override type = "SkyActor";

	/**
	 * The turbidity of the sky.
	 */
	get turbidity(): number { return this.material.uniforms.turbidity.value; }
	set turbidity(v: number) { this.material.uniforms.turbidity.value = v; }

	/**
	 * The rayleigh scattering coefficient.
	 */
	get rayleigh(): number { return this.material.uniforms.rayleigh.value; }
	set rayleigh(v: number) { this.material.uniforms.rayleigh.value = v; }

	/**
	 * The mie scattering coefficient.
	 */
	get mieCoefficient(): number { return this.material.uniforms.mieCoefficient.value; }
	set mieCoefficient(v: number) { this.material.uniforms.mieCoefficient.value = v; }

	/**
	 * The mie scattering direction.
	 */
	get mieDirectionalG(): number { return this.material.uniforms.mieDirectionalG.value; }
	set mieDirectionalG(v: number) { this.material.uniforms.mieDirectionalG.value = v; }

	/**
	 * The sun's position in the sky (height).
	 */
	get elevation(): number { return this.#elevation; }
	set elevation(v: number) { this.#elevation = v; this.updateSunPosition(); }

	/**
	 * The sun's position in the sky (rotation / azimuth).
	 */
	get azimuth(): number { return this.#azimuth; }
	set azimuth(v: number) { this.#azimuth = v; this.updateSunPosition(); }

	constructor()
	{
		super();
		this.object3d = new Sky();
		this.sky.scale.setScalar( 450000 );
	}

	private updateSunPosition()
	{
		const phi = Three.MathUtils.degToRad( 90 - this.#elevation );
		const theta = Three.MathUtils.degToRad( this.#azimuth );
		this.#sunPosition.setFromSphericalCoords( 1, phi, theta );
		this.material.uniforms.sunPosition.value.copy(this.#sunPosition);

		this.scene?.getComponentsByTag(SkyDirectionalLightTag).forEach(sunTracker => {
			if(isActor(sunTracker))
			{
				if(sunTracker.object3d instanceof Three.DirectionalLight)
				{
					sunTracker.object3d.position.copy(this.#sunPosition);
					sunTracker.object3d.updateMatrix();
				}
			}
		})
		this.sky.material.needsUpdate = true;
		this.sky.matrixWorldNeedsUpdate = true;
	}

	override onStart()
	{
		this.updateSunPosition();
 	}

	private get sky() { return this.object3d as Sky; }
	private get material() { return this.sky.material as Three.ShaderMaterial; }

	#sunPosition = new Three.Vector3();
	#elevation = 2;
	#azimuth = 180;
}
