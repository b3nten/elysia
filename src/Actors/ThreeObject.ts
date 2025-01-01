// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';
import { Actor } from "../Core/Actor.ts";
import {
	s_BoundingBox,
	s_Destroyed,
	s_OnEnterScene,
	s_OnLeaveScene,
} from "../Internal/mod.ts";

/**
 * An actor that wraps a Three.js Object3D.
 * By default, the object3d is an empty Object3D. If you want to create a specific type of object, you can pass it in the constructor.
 * The Actor's transform is propagated to the object3d transform. No manual update is required.
 */
export class ThreeObject<T extends Three.Object3D = Three.Object3D> extends Actor {

	constructor(public object3d: T = new Three.Object3D() as T)
	{
		super();
		this.static = false;
		this.object3d.matrixAutoUpdate = false;
		this.object3d.matrixWorldAutoUpdate = false;
		this.object3d.matrixWorld = this.worldMatrix;
		this.object3d.userData.actor = this;
	}

	override [s_OnEnterScene]()
	{
		super[s_OnEnterScene]();
		if(this.destroyed) return;
		this.scene.object3d.add(this.object3d);
	}

	override onTransformUpdate()
	{
		this.worldMatrix.decompose(this.object3d.position, this.object3d.quaternion, this.object3d.scale);
		this.object3d.updateMatrix()
		this.object3d.updateMatrixWorld();
	}

	override getBoundingBox(): Three.Box3
	{
		this[s_BoundingBox].setFromObject(this.object3d);
		return this[s_BoundingBox];
	}

	override [s_OnLeaveScene]()
	{
		super[s_OnLeaveScene]();
		if(this[s_Destroyed]) return;
		this.scene.object3d.remove(this.object3d);
	}
}
