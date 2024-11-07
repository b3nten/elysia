import { Actor } from "./Actor.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';
import { Destroyable } from "../Core/Lifecycle.ts";
import { Future } from "../Containers/Future.ts";
import { bound, Constructor, noop } from "../Core/Utilities.ts";
import { Behavior } from "./Behavior.ts";
import { ElysiaEventDispatcher } from "../Events/EventDispatcher.ts";
import { ComponentAddedEvent, ComponentRemovedEvent, TagAddedEvent, TagRemovedEvent } from "../Core/ElysiaEvents.ts";
import { Component, isThreeActor } from "./Component.ts";
import { ComponentSet } from "../Containers/ComponentSet.ts";
import {
	s_ActiveCamera,
	s_App, s_Created, s_Destroyed,
	s_Loaded, s_Object3D,
	s_OnBeforePhysicsUpdate,
	s_OnCreate,
	s_OnDestroy,
	s_OnLoad,
	s_OnStart,
	s_OnUpdate, s_Parent, s_Scene,
	s_SceneLoadPromise, s_Started,
} from "./Internal.ts";
import { Application } from "../Core/ApplicationEntry.ts";
import { LifeCycleError, reportLifecycleError } from "./Errors.ts";
import { PhysicsWorld } from "../Physics/PhysicsWorld.ts";
import { AutoInitializedMap } from "../Containers/AutoInitializedMap.ts";
import { ThreeActor } from "./ThreeActor.ts";

export const Root = Symbol.for("Elysia::Scene::Root");

export const IsScene = Symbol.for("Elysia::IsScene");

export class Scene implements Destroyable
{
	[IsScene]: boolean = true;

	public readonly type: string = "Scene";

	public physics?: PhysicsWorld;

	/** Get the root Three.Scene */
	get object3d(): Three.Scene { return this[s_Object3D]; }

	/** Get the owning Application */
	get app(): Application | null { return this[s_App]; }

	/** The s_Scene's active camera */
	get activeCamera(): Three.Camera { return this.getActiveCamera(); }

	set activeCamera(camera: Three.Camera | ThreeActor<Three.Camera>)
	{
		this[s_ActiveCamera] = isThreeActor(camera) ? camera.object3d : camera;
	}

	constructor()
	{
		ElysiaEventDispatcher.addEventListener(ComponentAddedEvent, (e) => {
			const type = e.child.constructor as Constructor<Component>
			this.#componentsByType.get(type).add(e.child);
		})

		ElysiaEventDispatcher.addEventListener(ComponentRemovedEvent, (e) => {
			const type = e.child.constructor as Constructor<Component>
			this.#componentsByType.get(type).delete(e.child);
			for(const tag of e.child.tags)
			{
				this.#componentsByTag.get(tag).delete(e.child);
			}
		})

		ElysiaEventDispatcher.addEventListener(TagAddedEvent, (event) => {
			this.#componentsByTag.get(event.tag).add(event.target);
		})

		ElysiaEventDispatcher.addEventListener(TagRemovedEvent, (event) => {
			this.#componentsByTag.get(event.tag).delete(event.target);
		})
	}

	/**
	 * Adds a component to this s_Scene.
	 * @param component
	 */
	@bound public addComponent(...components: Component[]): this
	{
		for(const c of components)
		{
			this[Root].addComponent(c);
		}
		return this;
	}

	/**
	 * Removes a component to this s_Scene.
	 * @param component
	 * @returns `true` if the component was successfully added, `false` otherwise.
	 */
	@bound public removeComponent(...components: Component[]): this
	{
		for(const c of components)
		{
			this[Root].removeComponent(c);
		}
		return this;
	}

	/**
	 * Returns all actors in the s_Scene with the given tag.
	 * @param tag
	 */
	@bound public getComponentsByTag(tag: any): ComponentSet<Component>
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
	@bound public getComponentsByType<T extends Actor | Behavior>(type: Constructor<T>): ComponentSet<T>
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
	@bound public getActiveCamera(): Three.Camera { return this[s_ActiveCamera]; }

	onLoad(): void | Promise<void> {}

	onCreate(){}

	onStart(){}

	onBeforePhysicsUpdate(delta: number, elapsed: number) {}

	onUpdate(delta: number, elapsed: number) {}

	onDestroy(){}

	destructor()
	{
		this[s_OnDestroy]();
	}

	@bound async [s_OnLoad]()
	{
		if(this[s_Loaded] || this[s_Destroyed]) return;

		try
		{
			await Promise.all([this.onLoad(), this.physics?.[s_OnLoad](this) ?? Promise.resolve()]);
		}
		catch(error)
		{
			throw new LifeCycleError("onLoad", this, error);
		}

		this[s_Loaded] = true;
		this[s_SceneLoadPromise].resolve()
	}

	@bound [s_OnCreate]()
	{
		if(this[s_Created] || !this[s_Loaded] || this[s_Destroyed]) return;

		this[Root][s_App] = this[s_App];
		this[Root][s_Scene] = this;
		this[Root][s_Parent] = null;

		reportLifecycleError(this, this.onCreate);

		this[s_Created] = true;

		this[Root][s_OnCreate]();
	}

	@bound [s_OnStart]()
	{
		if(this[s_Started] || !this[s_Created] || this[s_Destroyed]) return;
		this.physics?.[s_OnStart]()
		reportLifecycleError(this, this.onStart);
		this[s_Started] = true;
		this[Root][s_OnStart]();
		// this[s_Object3D].matrixAutoUpdate = false;
		// this[s_Object3D].matrixWorldAutoUpdate = false;
		// this[s_Object3D].updateMatrixWorld();
	}

	@bound [s_OnBeforePhysicsUpdate](delta: number, elapsed: number)
	{
		if(!this.physics) return;
		if(this[s_Destroyed]) return;
		if(!this[s_Started]) this[s_OnStart]();
		reportLifecycleError(this, this.onBeforePhysicsUpdate, delta, elapsed);
		this[Root][s_OnBeforePhysicsUpdate](delta, elapsed);
		this.physics[s_OnUpdate](delta, elapsed);
	}

	@bound [s_OnUpdate](delta: number, elapsed: number)
	{
		if(this[s_Destroyed]) return;
		if(!this[s_Started]) this[s_OnStart]();
		reportLifecycleError(this, this.onUpdate, delta, elapsed);
		this[Root][s_OnUpdate](delta, elapsed);
	}

	@bound [s_OnDestroy]()
	{
		if(this[s_Destroyed]) return;
		reportLifecycleError(this, this[Root].destructor);
		reportLifecycleError(this, this.onDestroy);
		this.#componentsByTag.clear();
		this.#componentsByType.clear();
		this[s_App] = null;
		this[s_Destroyed] = true;
		this[Root][s_OnDestroy]();
	}

	[s_SceneLoadPromise]: Future<void> = new Future<void>(noop);

	[s_ActiveCamera]: Three.Camera = new Three.PerspectiveCamera();

	[s_Object3D]: Three.Scene = new Three.Scene;

	[Root]: SceneActor = new SceneActor;

	[s_App]: Application | null = null;

	[s_Loaded] = false;

	[s_Created] = false;

	[s_Started] = false;

	[s_Destroyed] = false;

	#componentsByTag = new AutoInitializedMap<any, ComponentSet<Component>>(ComponentSet)
	#componentsByType = new AutoInitializedMap<Constructor<Component>, ComponentSet<Component>>(ComponentSet)
}

export class SceneActor extends Actor
{
	constructor() { super(); }
}
