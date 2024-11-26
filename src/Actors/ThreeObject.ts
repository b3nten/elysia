// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';
import { Actor } from "../Core/Actor.ts";
import {
	s_Destroyed,
	s_OnEnterScene,
	s_OnLeaveScene,
	s_OnUpdate, s_TransformDirty,
} from "../Internal/mod.ts";

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

	override [s_OnLeaveScene]()
	{
		super[s_OnLeaveScene]();
		if(this[s_Destroyed]) return;
		this.scene.object3d.remove(this.object3d);
	}
}
