/**
 * @module
 *
 * This module contains the MeshActor class, which can be used to render Three.BufferGeometries.
 *
 * @example
 * ```ts
 * const geometry = new Three.BoxBufferGeometry(1, 1, 1);
 * const material = new Three.MeshBasicMaterial({color: 0xff0000});
 * const actor = new MeshActor(geometry, material);
 * scene.add(actor);
 * ```
 */

import { Actor } from "../Scene/Actor.ts";
// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three';

export class MeshActor extends Actor<Three.Mesh>
{
	override type: string = "MeshActor";

	/**
	 * The underlying Three.BufferGeometry.
	 */
	get geometry(): Three.BufferGeometry { return this.object3d.geometry; }
	set geometry(value: Three.BufferGeometry) { this.object3d.geometry = value; }

	/**
	 * The underlying Three.Material.
	 */
	get material(): Three.Material { return this.object3d.material as Three.Material; }
	set material(value: Three.Material) { this.object3d.material = value; }

	/**
	 * Whether the actor casts shadows.
	 * @default true
	 */
	get castShadow(): boolean { return this.object3d.castShadow; }
	set castShadow(value: boolean) { this.object3d.castShadow = value; }

	/**
	 * Whether the actor receives shadows.
	 * @default true
	 */
	get receiveShadow(): boolean { return this.object3d.receiveShadow; }
	set receiveShadow(value: boolean) { this.object3d.receiveShadow = value; }

	/**
	 * Should the actor render a debug helper.
	 */
	get debug(): boolean { return this.#debug; }
	set debug(value: boolean)
	{
		if(value)
		{
			this.#debugHelper ??= new Three.BoxHelper(this.object3d, "red");
			this.object3d.add(this.#debugHelper);
		}
		else
		{
			this.#debugHelper?.parent?.remove(this.#debugHelper);
			this.#debugHelper?.dispose();
			this.#debugHelper = undefined;
		}
		this.#debug = value;
	}

	constructor(geometry: Three.BufferGeometry, material: Three.Material, castShadow = true, receiveShadow = true)
	{
		super();
		this.object3d = new Three.Mesh(geometry, material);
		this.castShadow = castShadow;
		this.receiveShadow = receiveShadow;
	}

	#debug = false;
	#debugHelper?: Three.BoxHelper;
}
