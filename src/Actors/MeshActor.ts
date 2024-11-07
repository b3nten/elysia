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

type BatchedMeshPool = Map<Three.Material, {
	batchedMesh: Three.BatchedMesh,
	geoInstances: Map<Three.BufferGeometry, number>,
	actors: Set<MeshActor>,
	refs: number
	maxVertices: number
	maxIndices: number
}>

export class MeshActor extends Actor
{
	/**
	 * The underlying Three.BufferGeometry.
	 */
	get geometry(): Three.BufferGeometry { return this.#geometry; }
	set geometry(value: Three.BufferGeometry)
	{
		if(this.geometry === value) return;
		this.removeActorFromBatchedMesh();
		this.#geometry = value;
		this.addActorToBatchedMesh();
	}

	/**
	 * The underlying Three.Material.
	 */
	get material(): Three.Material { return this.#material as Three.Material; }
	set material(value: Three.Material)
	{
		if(this.#material === value) return;
		this.removeActorFromBatchedMesh();
		this.#material = value;
		this.addActorToBatchedMesh();
	}

	constructor(geometry: Three.BufferGeometry, material: Three.Material)
	{
		super();
		this.#geometry = geometry;
		this.#material = material;
	}

	override onCreate()
	{
		// create if not exists
		if(!this.scene.userData.has("BatchedMeshPool"))
		{
			this.scene.userData.set("BatchedMeshPool", new Map());
		}
	}

	override onEnterScene()
	{
		this.addActorToBatchedMesh()
	}

	override onUpdate(delta: number, elapsed: number) {
		if(this.#instanceId === undefined) return;
		this.#meshMap!.get(this.#material)?.batchedMesh.setMatrixAt(this.#instanceId, this.worldMatrix);
	}

	override onLeaveScene()
	{
		this.removeActorFromBatchedMesh();
	}

	private addActorToBatchedMesh()
	{
		const meshMap = this.scene.userData.get("BatchedMeshPool") as BatchedMeshPool;

		this.#meshMap = meshMap;

		let mesh = meshMap.get(this.#material);

		if(mesh === undefined)
		{
			// creating buffer space
			const maxVertices = 1000;
			const maxIndices = 3000;
			const instanceCount = 10;

			const batchedMesh = new Three.BatchedMesh(instanceCount, maxVertices, maxIndices, this.#material);
			batchedMesh.perObjectFrustumCulled = true;
			this.scene.object3d.add(batchedMesh);

			const geoInstances = new Map<Three.BufferGeometry, number>();

			mesh = {
				batchedMesh,
				geoInstances,
				maxVertices,
				maxIndices,
				refs: 0,
				actors: new Set()
			};

			meshMap.set(this.#material, mesh);
		}

		let geometryId = mesh.geoInstances.get(this.#geometry);

		// add geometry to batched mesh, creating space for it
		if(geometryId === undefined)
		{
			mesh.maxVertices = mesh.maxVertices
				+ this.#geometry.getAttribute("position").count

			mesh.maxIndices = mesh.maxIndices +
				(this.#geometry.index?.count ?? this.#geometry.getAttribute("position").count)

			mesh.batchedMesh.setGeometrySize(mesh.maxVertices, mesh.maxIndices);

			geometryId = mesh.batchedMesh.addGeometry(this.#geometry);

			mesh.geoInstances.set(this.#geometry, geometryId);
		}

		// update instance count
		if(mesh.batchedMesh.maxInstanceCount < mesh.refs + 1)
		{
			mesh.batchedMesh.setInstanceCount(mesh.batchedMesh.maxInstanceCount*2);
		}

		// create our instance
		this.#instanceId = mesh.batchedMesh.addInstance(geometryId);

		// mesh.batchedMesh.setVisibleAt(this.#instanceId, false);

		// register actor
		mesh.actors.add(this);
		meshMap.get(this.#material)!.refs++;
	}

	private removeActorFromBatchedMesh()
	{
		const meshMap = this.scene.userData.get("BatchedMeshPool") as BatchedMeshPool;

		const mesh = meshMap.get(this.#material);

		if(mesh === undefined) return;

		mesh.batchedMesh.deleteInstance(this.#instanceId!);
		mesh.refs--;
		mesh.actors.delete(this);

		// if no actors are using this mesh, remove it
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
	#meshMap?: BatchedMeshPool;
}
