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

export class MeshActor extends Actor
{
	/**
	 * The underlying Three.BufferGeometry.
	 */
	get geometry(): Three.BufferGeometry { return this.geometry; }
	set geometry(value: Three.BufferGeometry)
	{
		if(this.geometry === value) return;
		// todo: swap geometry
		this.geometry = value;
	}

	/**
	 * The underlying Three.Material.
	 */
	get material(): Three.Material { return this.material as Three.Material; }
	set material(value: Three.Material)
	{
		if(this.material === value) return;
		// todo: swap material
		this.material = value;
	}

	constructor(geometry: Three.BufferGeometry, material: Three.Material)
	{
		super();
		this.#geometry = geometry;
		this.#material = material;
	}

	override onEnterScene()
	{
		let mesh = meshMap.get(this.#material);

		if(mesh === undefined)
		{
			const batchedMesh = new Three.BatchedMesh(100000, 5000000, 5000000, this.#material);
			batchedMesh.perObjectFrustumCulled = true;
			this.scene.object3d.add(batchedMesh);

			const geoInstances = new Map<Three.BufferGeometry, number>();
			const index = batchedMesh.addGeometry(this.#geometry);
			geoInstances.set(this.#geometry, index);

			mesh = { batchedMesh, geoInstances, refs: 0};
			meshMap.set(this.#material, mesh);
		}

		const geometryId = mesh.geoInstances.get(this.#geometry);

		if(geometryId === undefined)
		{
			const index = mesh.batchedMesh.addGeometry(this.#geometry);
			mesh.geoInstances.set(this.#geometry, index);
			this.#instanceId = mesh.batchedMesh.addInstance(index);
		}
		else
		{
			this.#instanceId = mesh.batchedMesh.addInstance(geometryId);
		}

		meshMap.get(this.#material)!.refs++;

		meshMap.get(this.#material)?.batchedMesh.setMatrixAt(this.#instanceId, this.worldMatrix);

	}

	override onUpdate(delta: number, elapsed: number) {
		if(this.#instanceId === undefined) return;
		meshMap.get(this.#material)?.batchedMesh.setMatrixAt(this.#instanceId, this.worldMatrix);
	}

	override onLeaveScene()
	{
		const mesh = meshMap.get(this.#material);

		if(mesh === undefined) return;

		mesh.batchedMesh.deleteInstance(this.#instanceId!);
		mesh.refs--;

		if(mesh.refs === 0)
		{
			meshMap.delete(this.#material);
			mesh.batchedMesh.dispose();
			this.scene.object3d.remove(mesh.batchedMesh);
		}
	}

	#instanceId?: number;
	#geometry: Three.BufferGeometry;
	#material: Three.Material;
}

const meshMap: Map<Three.Material, { batchedMesh: Three.BatchedMesh, geoInstances: Map<Three.BufferGeometry, number>, refs: number }> = new Map();