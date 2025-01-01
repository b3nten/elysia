/**
 * @module
 *
 * This module contains the Mesh Actor, which can be used to render Three.BufferGeometries.
 *
 * @example
 * ```ts
 * const geometry = new Three.BoxBufferGeometry(1, 1, 1);
 * const material = new Three.MeshBasicMaterial({color: 0xff0000});
 * const actor = new Mesh(geometry, material);
 * scene.add(actor);
 * ```
 */

import { Actor } from "../Core/Actor.ts";
import { isArray } from "../Shared/Asserts.ts";
// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three';
import { BatchedMesh } from "../WebGL/BatchedLodMesh.ts"
import { s_BoundingBox } from "../Internal/mod.ts";

/**
 * The Mesh class is used to render Three.BufferGeometries and materials. Meshes are batched according to material, so multiple geometries can be rendered
 * in a single drawcall if they share the same material. Meshes can also be batched according to distance from the camera, allowing for level of detail (LOD) rendering.
 */
export class Mesh extends Actor
{
	/**
	 * Create an LOD group for the Mesh. LOD groups allow you to specify multiple levels of detail for a mesh, which will be rendered based on the distance from the camera.
	 */
	static CreateLods = createLodGroup;

	public get visible(): boolean { return this.#userVisibility }
	public set visible(value: boolean)
	{
		if(this.#userVisibility === value) return;
		this.#userVisibility = value;
		for(let i = 0; i < this.#lods.length; i++)
		{
			for(let l = 0; l < this.#lods[i].meshes.length; l++)
			{
				const mesh = this.#lods[i].meshes[l];
				this.#meshMap!.get(mesh.key)?.batchedMesh.setVisibleAt(mesh.instanceId, value);
			}
		}
	}

	constructor(mesh: Mesh )
	constructor(meshes: Array<Mesh>)
	constructor(meshGroup: MeshGroup)
	constructor(lodGroup: LodGroup)
	constructor(geometry: Three.BufferGeometry, material?: Three.Material)
	constructor(arg1: Three.BufferGeometry | Mesh | MeshGroup | Array<Mesh> | LodGroup, arg2?: Three.Material) {
		super();

		// set up max and min draw distance
		if (isLodGroup(arg1)) {
			if (arg1.maxDrawDistance !== undefined) this.#maxDrawDistance = arg1.maxDrawDistance;
		}

		// @ts-ignore: todo: fix
		const lods: Array<Mesh | MeshGroup | Array<Mesh>> = isLodGroup(arg1)
			? arg1.levels.sort((a, b) => a.distance - b.distance)
			: arg1 instanceof Three.BufferGeometry
				? [{geometry: arg1, material: arg2!}]
				: [arg1];

		for (let i = 0; i < lods.length; i++) {
			const lod = lods[i]
			if (isMeshObject(lod)) {
				this.#lods[i] = {
					// @ts-ignore shortcut for lodgroup as well
					distance: lod.distance ?? -Infinity,
					meshes: [{
						geometry: lod.geometry,
						material: validateMaterial(lod.material),
						instanceId: -1,
						key: this.generateMeshKey(lod.geometry, validateMaterial(lod.material))
					}]
				}
			} else if (isMeshGroup(lod)) {
				this.#lods[i] = {
					distance: -Infinity,
					meshes: []
				}
				for (let j = 0; j < lod.children.length; j++) {
					const child = lod.children[j];
					if (!isMeshObject(child)) continue;

					this.#lods[i].meshes.push({
						geometry: child.geometry,
						material: validateMaterial(child.material),
						instanceId: -1,
						key: this.generateMeshKey(child.geometry, validateMaterial(child.material))
					})
				}
			} else if (isArray(lod)) {
				this.#lods[i] = {
					distance:-Infinity,
					meshes: []
				}
				for (let j = 0; j < lod.length; j++) {
					const child = lod[j];
					if (!isMeshObject(child)) continue;

					this.#lods[i].meshes.push({
						geometry: child.geometry,
						material: validateMaterial(child.material),
						instanceId: -1,
						key: this.generateMeshKey(child.geometry, validateMaterial(child.material))
					})
				}
			}
		}
	}

	override getBoundingBox(): Three.Box3
	{
		// todo: improve performance
		const box = new Three.Box3();
		for(let i = 0; i < this.#lods.length; i++)
		{
			for(let l = 0; l < this.#lods[i].meshes.length; l++)
			{
				const mesh = this.#lods[i].meshes[l];
				const batchedMesh = this.#meshMap?.get(mesh.key)?.batchedMesh;
				if(batchedMesh === undefined) continue;
				const temp = new Three.Box3();
				box.union(batchedMesh.getBoundingBoxAt(mesh.instanceId, temp) ?? temp);
			}
		}
		this[s_BoundingBox].copy(box);
		return this[s_BoundingBox];
	}

	override onCreate()
	{
		if(!this.scene.userData.has("BatchedMeshPool"))
		{
			this.scene.userData.set("BatchedMeshPool", new Map());
		}
	}

	override onEnterScene() { this.addActorToBatchedMesh() }

	override onEnable(): void { this.visible = true; }

	override onDisable(): void { this.visible = false; }

	override onLeaveScene()  { this.removeActorFromBatchedMesh(); }

	private addActorToBatchedMesh()
	{
		const meshMap = this.scene.userData.get("BatchedMeshPool") as BatchedMeshPool;

		for(let l = 0; l < this.#lods.length; l++)
		{
			for(let m = 0; m < this.#lods[l].meshes.length; m++)
			{
				this.#meshMap = meshMap;

				const meshInstance = this.#lods[l].meshes[m];

				let mesh = meshMap.get(meshInstance.key);

				if(mesh === undefined)
				{
					// creating buffer space
					const maxVertices = 1000;
					const maxIndices = 3000;
					const instanceCount = 10;

					const batchedMesh: any = new BatchedMesh(instanceCount, maxVertices, maxIndices, meshInstance.material);

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

					meshMap.set(meshInstance.key, mesh);
				}

				let geometryId = mesh.geoInstances.get(meshInstance.geometry);

				// add geometry to batched meshes, creating space for it
				if(geometryId === undefined)
				{
					mesh.maxVertices = mesh.maxVertices
						+ meshInstance.geometry.getAttribute("position").count

					mesh.maxIndices = mesh.maxIndices +
						(meshInstance.geometry.index?.count ?? meshInstance.geometry.getAttribute("position").count)

					// @ts-ignore - types are not updated
					mesh.batchedMesh.setGeometrySize(mesh.maxVertices, mesh.maxIndices);

					geometryId = mesh.batchedMesh.addGeometry(meshInstance.geometry);

					mesh.geoInstances.set(meshInstance.geometry, geometryId!);
				}

				// update instance count
				if(mesh.batchedMesh.maxInstanceCount < mesh.refs + 1)
				{
					// @ts-ignore - types are not updated
					mesh.batchedMesh.setInstanceCount(mesh.batchedMesh.maxInstanceCount*2);
				}

				// create our instance
				meshInstance.instanceId = mesh.batchedMesh.addInstance(geometryId);

				// @ts-ignore - extended
				mesh.batchedMesh._instanceInfo[meshInstance.instanceId].lodRange = [
					this.#lods[l]?.distance,
					this.#lods[l+1]?.distance ?? this.#maxDrawDistance
				]

				// @ts-ignore - extended
				mesh.batchedMesh._instanceInfo[meshInstance.instanceId].getWorldMatrix = () => this.worldMatrix;

				(mesh.batchedMesh as any).castShadow = true;
				(mesh.batchedMesh as any).receiveShadow = true;
				// register actor
				mesh.actors.add(this);
				mesh.refs++;
			}
		}

	}

	private removeActorFromBatchedMesh()
	{
		const meshMap = this.#meshMap!

		for(let i = 0; i < this.#lods.length; i++)
		{
			for(let l = 0; l < this.#lods[i].meshes.length; l++)
			{
				const lod = this.#lods[i].meshes[l];

				const mesh = meshMap.get(lod.key);

				if(mesh === undefined) return;

				mesh.batchedMesh.deleteInstance(lod.instanceId);
				mesh.refs--;
				mesh.actors.delete(this);

				// if no actors are using this meshes, remove it
				if(mesh.refs === 0)
				{
					meshMap.delete(lod.material.uuid);
					mesh.batchedMesh.dispose();
					this.scene.object3d.remove(mesh.batchedMesh as any);
				}
			}
		}
	}

	private generateMeshKey(geometry: Three.BufferGeometry, material: Three.Material)
	{
		let key = `${material.uuid}-${Boolean(geometry.index)}-`;
		for (const attribute in geometry.attributes) key += `${attribute}`
		return key;
	}

	#meshMap?: BatchedMeshPool;
	#userVisibility = true;
	#maxDrawDistance = Infinity;
	#lods: Array<{
		distance: number
		meshes: Array<{
			geometry: Three.BufferGeometry,
			material: Three.Material
			instanceId: number
			key: string
		}>
	}> = [];
}

const validateMaterial = (material: Three.Material | Array<Three.Material>): Three.Material =>
{
	if(Array.isArray(material))
	{
		if(material.length > 1) throw Error("Mesh: Array of materials is not supported.")
		return material[0];
	}
	return material;
}

type BatchedMeshPool = Map<string, {
	batchedMesh: BatchedMesh,
	geoInstances: Map<Three.BufferGeometry, number>,
	actors: Set<Mesh>,
	refs: number
	maxVertices: number
	maxIndices: number
}>

type MeshObject = { geometry: Three.BufferGeometry, material: Three.Material | Array<Three.Material> }
const isMeshObject = (obj: any): obj is MeshObject => obj.geometry !== undefined && obj.material !== undefined;

type MeshGroup = { children: Array<any> }
const isMeshGroup = (obj: any): obj is MeshGroup => Array.isArray(obj.children);

/**
 * A LOD group for Meshes. LOD groups allow you to specify multiple levels of detail for a mesh, which will be rendered based on the distance from the camera.
 * @param mesh The LOD group to create.
 */
export type LodGroup = {
	levels: Array<{
		/** The max distance at which this LOD will be rendered. */
		distance: number,
		geometry: Three.BufferGeometry,
		material: Three.Material
	}>,
	/** The maximum distance at which the highest LOD will be rendered. */
	maxDrawDistance?: number
}
/** Create an LOD group for the Mesh. LOD groups allow you to specify multiple levels of detail for a mesh, which will be rendered based on the distance from the camera. */
export function createLodGroup(mesh: LodGroup): LodGroup { return mesh }
const isLodGroup = (obj: any): obj is LodGroup => Array.isArray(obj.levels);
