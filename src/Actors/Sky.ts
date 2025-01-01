/**
 * @module
 *
 * This module contains the Sky class, which can be used to render a physical sky.
 *
 * See https://threejs.org/docs/#examples/en/objects/Skyfor more information.
 */

// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three';
// @ts-types="npm:@types/three@^0.169.0/examples/jsm/Sky"
import { Sky as SkyImpl } from "three/examples/jsm/objects/Sky.js";
import { ThreeObject } from "./ThreeObject.ts";

export class Sky extends ThreeObject<SkyImpl>
{
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

	public readonly directionalLight: Three.DirectionalLight = new Three.DirectionalLight(0xffffff, 5);
	public readonly skyLight: Three.HemisphereLight = new Three.HemisphereLight(0xffffff, 0x444444);

	constructor()
	{
		super(new SkyImpl);
		this.scale.setScalar( 450000 );
		this.directionalLight.castShadow = true;
		this.directionalLight.shadow.bias = -0.0001;
		this.directionalLight.shadow.mapSize.width = 2048;
		this.directionalLight.shadow.mapSize.height = 2048;
		this.directionalLight.shadow.camera.left = - 100;
		this.directionalLight.shadow.camera.right = 100;
		this.directionalLight.shadow.camera.top = 100;
		this.directionalLight.shadow.camera.bottom = - 100;
	}

	private updateSunPosition()
	{
		const phi = Three.MathUtils.degToRad( 90 - this.#elevation );
		const theta = Three.MathUtils.degToRad( this.#azimuth );
		this.#sunPosition.setFromSphericalCoords( 20, phi, theta );
		this.material.uniforms.sunPosition.value.copy(this.#sunPosition);
		this.directionalLight.position.copy(this.#sunPosition);
		this.directionalLight.updateMatrix();
		this.sky.material.needsUpdate = true;
		this.sky.matrixWorldNeedsUpdate = true;
	}

	override onEnterScene()
	{
		this.updateSunPosition();
		this.scene.object3d.add(this.directionalLight);
		this.scene.object3d.add(this.skyLight);
 	}

	 override onLeaveScene()
	 {
		this.scene.object3d.remove(this.directionalLight);
		this.scene.object3d.remove(this.skyLight);
	 }

	private get sky() { return this.object3d as SkyImpl; }
	private get material() { return this.sky.material as Three.ShaderMaterial; }

	#sunPosition = new Three.Vector3();
	#elevation = 2;
	#azimuth = 180;
}
