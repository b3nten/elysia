import { Actor } from "./Actor.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';
import type { IDestroyable } from "./Lifecycle.ts";
import { Future } from "../Containers/Future.ts";
import { type Constructor, noop } from "../Shared/Utilities.ts";
import type { Behavior } from "./Behavior.ts";
import { EventDispatcher } from "../Events/EventDispatcher.ts";
import { ComponentAddedEvent, ComponentRemovedEvent, TagAddedEvent, TagRemovedEvent } from "./ElysiaEvents.ts";
import { type Component, isThreeActor } from "./Component.ts";
import { ComponentSet } from "../Containers/ComponentSet.ts";
import { IsScene, s_ActiveCamera, s_App, s_Created, s_Destroyed, s_Loaded, s_Object3D, s_OnBeforePhysicsUpdate, s_OnCreate, s_OnDestroy, s_OnLoad, s_OnStart, s_OnUpdate, s_Parent, s_Scene, s_SceneLoadPromise, s_Started, SceneRoot } from "../Internal/mod.ts";
import type { Application } from "./Application.ts";
import { LifeCycleError, reportLifecycleError } from "./Errors.ts";
import { AutoInitializedMap } from "../Containers/AutoInitializedMap.ts";
import type { ThreeObject } from "../Actors/ThreeObject.ts";

export interface IScenePhysics extends IDestroyable
{
	onLoad?(scene: Scene): void | Promise<void>;
	onBeforePhysicsUpdate?(delta: number, elapsed: number): void;
	onUpdate?(delta: number, elapsed: number): void;
}

export class Scene implements IDestroyable
{
	public readonly userData: Map<any, any> = new Map;

	/**
	 * The physics world for this Scene.
	 * This runs before other behaviors & actors.
	 */
	public physics?: IScenePhysics;

	/** Get the root Three.Scene */
	get object3d(): Three.Scene { return this[s_Object3D]; }

	/** Get the owning Application */
	get app(): Application | null { return this[s_App]; }

	/** The s_Scene's active camera */
	get activeCamera(): Three.Camera { return this.getActiveCamera(); }

	set activeCamera(camera: Three.Camera | ThreeObject<Three.Camera>)
	{
		this[s_ActiveCamera] = isThreeActor(camera) ? camera.object3d : camera;
		this.app?.renderPipeline.onCameraChange(this[s_ActiveCamera]);
	}

	constructor()
	{
		EventDispatcher.addEventListener(ComponentAddedEvent, (e) => {
			const type = e.child.constructor as Constructor<Component>
			this.#componentsByType.get(type).add(e.child);
		})

		EventDispatcher.addEventListener(ComponentRemovedEvent, (e) => {
			const type = e.child.constructor as Constructor<Component>
			this.#componentsByType.get(type).delete(e.child);
			for(const tag of e.child.tags)
			{
				this.#componentsByTag.get(tag).delete(e.child);
			}
		})

		EventDispatcher.addEventListener(TagAddedEvent, (event) => {
			this.#componentsByTag.get(event.tag).add(event.target);
		})

		EventDispatcher.addEventListener(TagRemovedEvent, (event) => {
			this.#componentsByTag.get(event.tag).delete(event.target);
		})
	}

	/**
	 * Adds a component to this s_Scene.
	 * @param component
	 */
	public addComponent(...components: Component[]): this
	{
		for(const c of components)
		{
			this[SceneRoot].addComponent(c);
		}
		return this;
	}

	/**
	 * Removes a component to this s_Scene.
	 * @param component
	 * @returns `true` if the component was successfully added, `false` otherwise.
	 */
	public removeComponent(...components: Component[]): this
	{
		for(const c of components)
		{
			this[SceneRoot].removeComponent(c);
		}
		return this;
	}

	/**
	 * Returns all actors in the s_Scene with the given tag.
	 * @param tag
	 */
	public getComponentsByTag(tag: any): ComponentSet<Component>
	{
		const set = this.#componentsByTag.get(tag);
		if(!set)
		{
			const newSet = new ComponentSet<Component>();
			this.#componentsByTag.set(tag, newSet);
			return newSet;
		}
		else return set;
	}

	/**
	 * Returns all actors in the s_Scene with the given type.
	 */
	public getComponentsByType<T extends Actor | Behavior>(type: Constructor<T>): ComponentSet<T>
	{
		const set = this.#componentsByType.get(type);
		if(!set)
		{
			const newSet = new ComponentSet<T>();
			this.#componentsByType.set(type, newSet);
			return newSet;
		}
		else return set as ComponentSet<T>;
	}

	/**
	 * Returns the active camera in the s_Scene (if one is set via ActiveCameraTag).
	 * If multiple cameras are set as active, the first one found is returned.
	 */
	public getActiveCamera(): Three.Camera { return this[s_ActiveCamera]; }

	onLoad(): void | Promise<void> {}
	onCreate(){}
	onStart(){}
	onBeforePhysicsUpdate(delta: number, elapsed: number) {}
	onUpdate(delta: number, elapsed: number) {}
	onDestroy(){}

	destructor()
	{
		this[s_OnDestroy]();
		this.physics?.destructor();
		this.#componentsByTag.clear();
		this.#componentsByType.clear();
		this[s_App] = null;
		this[s_Destroyed] = true;
		this[SceneRoot][s_OnDestroy]();
	}

	/* **************************************************
	 Internal
	 ****************************************************/

	/** @internal */
	[IsScene]: boolean = true;

	/** @internal */
	[s_SceneLoadPromise]: Future<void> = new Future<void>(noop);

	/** @internal */
	[s_ActiveCamera]: Three.Camera = new Three.PerspectiveCamera();

	/** @internal */
	[s_Object3D]: Three.Scene = new Three.Scene;

	/** @internal */
	[SceneRoot]: SceneActor = new SceneActor;

	/** @internal */
	[s_App]: Application | null = null;

	/** @internal */
	[s_Loaded] = false;

	/** @internal */
	[s_Created] = false;

	/** @internal */
	[s_Started] = false;

	/** @internal */
	[s_Destroyed] = false;

	/** @internal */
	async [s_OnLoad]()
	{
		if(this[s_Loaded] || this[s_Destroyed]) return;
		await Promise.all([
			this.onLoad(),
			this.physics?.onLoad ? this.physics.onLoad(this) : Promise.resolve()
		]).catch((e) => {
			throw new LifeCycleError("Scene", "onLoad", e);
		})
		this[s_Loaded] = true;
		this[s_SceneLoadPromise].resolve()
	}

	/** @internal */
	[s_OnCreate]()
	{
		if(this[s_Created] || !this[s_Loaded] || this[s_Destroyed]) return;

		this[SceneRoot][s_App] = this[s_App];
		this[SceneRoot][s_Scene] = this;
		this[SceneRoot][s_Parent] = null;

		reportLifecycleError(this, this.onCreate);

		this[s_Created] = true;

		this[SceneRoot][s_OnCreate]();
	}

	/** @internal */
	[s_OnStart]()
	{
		if(this[s_Started] || !this[s_Created] || this[s_Destroyed]) return;
		reportLifecycleError(this, this.onStart);
		this[s_Started] = true;
		this[SceneRoot][s_OnStart]();
	}

	/** @internal */
	[s_OnBeforePhysicsUpdate](delta: number, elapsed: number)
	{
		if(!this.physics) return;
		if(this[s_Destroyed]) return;
		if(!this[s_Started]) this[s_OnStart]();
		reportLifecycleError(this, this.onBeforePhysicsUpdate, delta, elapsed);
		if(this.physics.onBeforePhysicsUpdate) reportLifecycleError(this.physics, this.physics.onBeforePhysicsUpdate, delta, elapsed);
		this[SceneRoot][s_OnBeforePhysicsUpdate](delta, elapsed);
	}

	/** @internal */
	[s_OnUpdate](delta: number, elapsed: number)
	{
		if(this[s_Destroyed]) return;
		if(!this[s_Started]) this[s_OnStart]();
		reportLifecycleError(this, this.onUpdate, delta, elapsed);
		if(this.physics?.onUpdate) reportLifecycleError(this.physics, this.physics.onUpdate, delta, elapsed);
		this[SceneRoot][s_OnUpdate](delta, elapsed);
	}

	/** @internal */
	[s_OnDestroy]()
	{
		if(this[s_Destroyed]) return;
		reportLifecycleError(this, this[SceneRoot].destructor);
		reportLifecycleError(this, this.onDestroy);
	}

	#componentsByTag = new AutoInitializedMap<any, ComponentSet<Component>>(ComponentSet)
	#componentsByType = new AutoInitializedMap<Constructor<Component>, ComponentSet<Component>>(ComponentSet)
}

class SceneActor extends Actor
{
	constructor() { super(); }
}
