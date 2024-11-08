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
import { isArray } from "../Core/Asserts.ts";

/*
	Todo:
	- Implement LOD system
	- Implement skeletalBatchedMesh
 */

type BatchedMeshPool = Map<string, {
	batchedMesh: Three.BatchedMesh,
	geoInstances: Map<Three.BufferGeometry, number>,
	actors: Set<MeshActor>,
	refs: number
	maxVertices: number
	maxIndices: number
}>

type Mesh = { geometry: Three.BufferGeometry, material: Three.Material | Array<Three.Material> }
const isMeshObject = (obj: any): obj is Mesh => obj.geometry !== undefined && obj.material !== undefined;

type MeshGroup = { children: Array<any> }
const isMeshGroup = (obj: any): obj is MeshGroup => Array.isArray(obj.children);

type LodMesh = {
	levels: Array<{
		distance: number,
		mesh: Mesh | MeshGroup
	}>,
	billboard?: Three.Mesh
}

const isLodMesh = (obj: any): obj is LodMesh => Array.isArray(obj.levels);

export class MeshActor extends Actor
{
	constructor(mesh: Mesh )
	constructor(meshGroup: MeshGroup)
	constructor(meshes: Array<Mesh>)
	constructor(geometry: Three.BufferGeometry, material?: Three.Material)
	constructor(a1: Three.BufferGeometry | Mesh | MeshGroup | Array<Mesh>, a2?: Three.Material)
	{
		super();
		// single object with geo and mat properties (like a Three.Mesh)
		if(isMeshObject((a1)))
		{
			if(Array.isArray(a1.material)) throw Error("MeshActor: Array of materials is not supported yet.")
			this.#geometries[0] = a1.geometry;
			this.#materials[0] = a1.material;
		}
		// object with children property (like a Three.Group containing meshes)
		else if(isMeshGroup(a1))
		{
			for(const child of a1.children)
			{
				if("geometry" in child && "material" in child)
				{
					if(Array.isArray(child.material)) throw Error("MeshActor: Array of materials is not supported yet.")
					this.#geometries.push(child.geometry);
					this.#materials.push(child.material)
				}
			}
		}
		// array of objects with geo and mat properties
		else if(isArray(a1))
		{
			for(const mesh of a1)
			{
				if("geometry" in mesh && "material" in mesh)
				{
					if(Array.isArray(mesh.material)) throw Error("MeshActor: Array of materials is not supported yet.")
					this.#geometries.push(mesh.geometry);
					this.#materials.push(mesh.material)
				}
			}
		}
		// separate geometry and material arguments
		else if(a1 instanceof Three.BufferGeometry)
		{
			this.#geometries[0] = a1;
			this.#materials[0] = a2!;
		}

		this.updateMeshKeys();
	}

	override onCreate()
	{
		if(!this.scene.userData.has("BatchedMeshPool"))
		{
			this.scene.userData.set("BatchedMeshPool", new Map());
		}
	}

	override onEnterScene()
	{
		this.addActorToBatchedMesh()
	}

	override onLeaveScene()
	{
		this.removeActorFromBatchedMesh();
	}

	override onUpdate()
	{
		for(let i = 0; i < this.#geometries.length; i++)
		{
			if(this.#instanceIds[i] === undefined) return;
			this.#meshMap!.get(this.#keys[i])?.batchedMesh.setMatrixAt(this.#instanceIds[i], this.worldMatrix);
		}
	}

	private addActorToBatchedMesh()
	{
		const meshMap = this.scene.userData.get("BatchedMeshPool") as BatchedMeshPool;

		for(let i = 0; i < this.#geometries.length; i++)
		{
			this.#meshMap = meshMap;

			let mesh = meshMap.get(this.#keys[i]);

			if(mesh === undefined)
			{
				// creating buffer space
				const maxVertices = 1000;
				const maxIndices = 3000;
				const instanceCount = 10;

				const batchedMesh = new Three.BatchedMesh(instanceCount, maxVertices, maxIndices, this.#materials[i]);

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

				meshMap.set(this.#keys[i], mesh);
			}

			let geometryId = mesh.geoInstances.get(this.#geometries[i]);

			// add geometry to batched mesh, creating space for it
			if(geometryId === undefined)
			{
				mesh.maxVertices = mesh.maxVertices
					+ this.#geometries[i].getAttribute("position").count

				mesh.maxIndices = mesh.maxIndices +
					(this.#geometries[i].index?.count ?? this.#geometries[i].getAttribute("position").count)

				mesh.batchedMesh.setGeometrySize(mesh.maxVertices, mesh.maxIndices);

				geometryId = mesh.batchedMesh.addGeometry(this.#geometries[i]);

				mesh.geoInstances.set(this.#geometries[i], geometryId);
			}

			// update instance count
			if(mesh.batchedMesh.maxInstanceCount < mesh.refs + 1)
			{
				mesh.batchedMesh.setInstanceCount(mesh.batchedMesh.maxInstanceCount*2);
			}

			// create our instance
			this.#instanceIds[i] = mesh.batchedMesh.addInstance(geometryId);

			// mesh.batchedMesh.setVisibleAt(this.#instanceId, false);

			// register actor
			mesh.actors.add(this);
			mesh.refs++;
		}
	}

	private removeActorFromBatchedMesh()
	{
		const meshMap = this.#meshMap!

		for(let i = 0; i < this.#geometries.length; i++)
		{
			const mesh = meshMap.get(this.#keys[i]);

			if(mesh === undefined) return;

			mesh.batchedMesh.deleteInstance(this.#instanceIds[i]!);
			mesh.refs--;
			mesh.actors.delete(this);

			// if no actors are using this mesh, remove it
			if(mesh.refs === 0)
			{
				meshMap.delete(this.#materials[i].uuid);
				mesh.batchedMesh.dispose();
				this.scene.object3d.remove(mesh.batchedMesh);
			}
		}
	}

	protected updateMeshKeys()
	{
		for(let i = 0; i < this.#geometries.length; i++)
		{
			this.#keys[i] = `${this.#materials[i].uuid}-${Boolean(this.#geometries[i].index)}-`;
			for(const key in this.#geometries[i].attributes) this.#keys[i] += `${key}`
		}
	}

	#meshMap?: BatchedMeshPool;


	#instanceIds: Array<number> = [];
	#geometries: Array<Three.BufferGeometry> = [];
	#materials: Array<Three.Material> = [];
	#keys: Array<string> = [];
}
