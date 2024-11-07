// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';
import { Actor } from "./Actor.ts";
import {
	s_Created, s_Destroyed,
	s_Enabled,
	s_InScene,
	s_OnEnterScene,
	s_OnLeaveScene,
	s_OnStart,
	s_OnUpdate,
	s_Started
} from "./Internal.ts";
import { ELYSIA_LOGGER } from "../Core/Logger.ts";
import { reportLifecycleError } from "./Errors.ts";

export class ThreeActor<T extends Three.Object3D = Three.Object3D> extends Actor {

	constructor(public object3d: T = new Three.Object3D() as T)
	{
		super();
	}

	override [s_OnEnterScene]()
	{
		if(this[s_InScene] || !this[s_Created]) return;
		if(this.destroyed)
		{
			ELYSIA_LOGGER.warn(`Trying to add a destroyed actor to scene: ${this}`);
			return;
		}
		this.scene.object3d.add(this.object3d);
		this.object3d.matrixAutoUpdate = false;
		this.object3d.matrixWorldAutoUpdate = false;
		this.object3d.matrixWorld = this.worldMatrix;
		reportLifecycleError(this, this.onEnterScene);
		this[s_InScene] = true;
		for(const component of this.components)
		{
			component[s_OnEnterScene]();
		}
	}

	override [s_OnUpdate](delta: number, elapsed: number)
	{
		super[s_OnUpdate](delta, elapsed);
		if(this[s_Destroyed]) return;
		this.worldMatrix;
	}

	override [s_OnLeaveScene]()
	{
		if(this[s_Destroyed]) return;
		if(!this[s_InScene]) return;
		reportLifecycleError(this, this.onLeaveScene);
		this[s_InScene] = false;
		for(const component of this.components)
		{
			component[s_OnLeaveScene]();
		}
		this.scene.object3d.remove(this.object3d);
	}
}
