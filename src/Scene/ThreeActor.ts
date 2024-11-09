// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';
import { Actor } from "./Actor.ts";
import {
	s_Destroyed,
	s_OnEnterScene,
	s_OnLeaveScene,
	s_OnUpdate, s_TransformDirty,
} from "./Internal.ts";

export class ThreeActor<T extends Three.Object3D = Three.Object3D> extends Actor {

	/**
	 * By default, the backing Three.Object3D shares a matrixWorld with the Actor.
	 * If you need the position, rotation, and scale values of the Three.Object3D to reflect it's world position,
	 * you can set this to true. Under the hood this will decompose the worldMatrix of the Actor into position, rotation, and scale,
	 * and set them on the Three.Object3D. Three.js will then calculate its own matrixWorld based on these values.
	 */
	get updatePositionRotationScale()
	{
		return this.object3d.matrixAutoUpdate;
	}

	set updatePositionRotationScale(value: boolean)
	{
		this.object3d.matrixAutoUpdate = value;
		this.object3d.matrixWorldAutoUpdate = value;
	}

	constructor(public object3d: T = new Three.Object3D() as T)
	{
		super();
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
		if(this.updatePositionRotationScale)
		{
			this.worldMatrix.decompose(this.object3d.position, this.object3d.quaternion, this.object3d.scale);
		}
		else
		{
			this.updateWorldMatrix();
		}
	}

	override [s_OnLeaveScene]()
	{
		super[s_OnLeaveScene]();
		if(this[s_Destroyed]) return;
		this.scene.object3d.remove(this.object3d);
	}
}
