import { Actor } from "./Actor.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';
import { Destroyable } from "../Core/Lifecycle.ts";
import { Future } from "../Containers/Future.ts";
import { bound, Constructor, noop } from "../Core/Utilities.ts";
import { Behavior } from "./Behavior.ts";
import { ElysiaEventDispatcher } from "../Events/EventDispatcher.ts";
import { ComponentAddedEvent, ComponentRemovedEvent, TagAddedEvent, TagRemovedEvent } from "../Core/ElysiaEvents.ts";
import { Component, isActor } from "./Component.ts";
import { GridActor } from "../Actors/GridActor.ts";
import { ComponentSet } from "../Containers/ComponentSet.ts";
import {
	s_ActiveCamera,
	s_App, s_Created, s_Destroyed,
	s_Loaded,
	s_OnBeforePhysicsUpdate,
	s_OnCreate,
	s_OnDestroy,
	s_OnLoad,
	s_OnStart,
	s_OnUpdate, s_Parent, s_Scene,
	s_SceneLoadPromise, s_Started
} from "./Internal.ts";
import { Application } from "../Core/ApplicationEntry.ts";
import { LifeCycleError, reportLifecycleError } from "./Errors.ts";
import { PhysicsWorld } from "../Physics/PhysicsWorld.ts";
import { World } from "../ECS/World.ts";
import { ThreeLightSystem } from "../ECS/ThreeSystems.ts";

export const Root = Symbol.for("Elysia::Scene::Root");

export const IsScene = Symbol.for("Elysia::IsScene");

export class Scene implements Destroyable
{
	[IsScene]: boolean = true;

	public readonly type: string = "Scene";

	public physics?: PhysicsWorld;

	public readonly ecs: World = new World;

	/** Get the root Three.Scene */
	get object3d(): Three.Scene { return this[Root].object3d; }

	/** Get the owning Application */
	get app(): Application | null { return this[s_App]; }

	/** Get the s_Scene grid actor */
	get grid(): GridActor { return this.#grid; }

	/** Get the s_Scene's ambient light */
	get ambientLight(): Three.AmbientLight { return this.#ambientLight; }

	/** The s_Scene's active camera */
	get activeCamera(): Three.Camera { return this.getActiveCamera(); }

	set activeCamera(camera: Three.Camera | Actor<Three.Camera>)
	{
		this[s_ActiveCamera] = camera instanceof Actor ? camera.object3d : camera;
		this[s_App]?.renderPipeline.onCameraChange(this[s_ActiveCamera]);
	}

	constructor()
	{
		ElysiaEventDispatcher.addEventListener(ComponentAddedEvent, (e) => {
			const type = e.child.constructor;

			if(!this.#componentsByType.has(type))
				this.#componentsByType.set(type, new ComponentSet);

			this.#componentsByType.get(type)!.add(e.child);

			if(isActor(e.child))
			{
				this.#allActors.add(e.child);
			}
			else
			{
				this.#allBehaviors.add(e.child);
			}
		})

		ElysiaEventDispatcher.addEventListener(ComponentRemovedEvent, (e) => {
			const type = e.child.constructor;
			this.#componentsByType.get(type)?.delete(e.child);

			if(isActor(e.child))
			{
				this.#allActors.delete(e.child);
			}
			else
			{
				this.#allBehaviors.delete(e.child);
			}

			for(const tag of e.child.tags)
			{
				this.#componentsByTag.get(tag)?.delete(e.child);
			}
		})

		ElysiaEventDispatcher.addEventListener(TagAddedEvent, (event) => {
			if(!this.#componentsByTag.has(event.tag))
				this.#componentsByTag.set(event.tag, new ComponentSet);

			this.#componentsByTag.get(event.tag)!.add(event.target);
		})

		ElysiaEventDispatcher.addEventListener(TagRemovedEvent, (event) => {
			this.#componentsByTag.get(event.tag)?.delete(event.target);
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

		this.object3d.add(this.#ambientLight);
		this.addComponent(this.#grid)
		this.grid.disable();

		this.ecs.addSystem(ThreeLightSystem, this)

		reportLifecycleError(this, this.onCreate);

		this[Root][s_App] = this[s_App];
		this[Root][s_Scene] = this;
		this[Root][s_Parent] = null;

		this[s_Created] = true;

		this[Root][s_OnCreate]();
	}

	@bound [s_OnStart]()
	{
		if(this[s_Started] || !this[s_Created] || this[s_Destroyed]) return;
		this.physics?.[s_OnStart]()
		this.ecs.start();
		reportLifecycleError(this, this.onStart);
		this[s_Started] = true;
		this[Root][s_OnStart]();
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
		this.ecs.update(delta, elapsed);
	}

	@bound [s_OnDestroy]()
	{
		if(this[s_Destroyed]) return;
		reportLifecycleError(this, this[Root].destructor);
		reportLifecycleError(this, this.onDestroy);
		this.#grid.destructor();
		this.ambientLight.dispose();
		this.#componentsByTag.clear();
		this.#componentsByType.clear();
		this[s_App] = null;
		this[s_Destroyed] = true;
		this[Root][s_OnDestroy]();
		this.ecs.destructor();
	}

	[s_SceneLoadPromise]: Future<void> = new Future<void>(noop);

	[s_ActiveCamera]: Three.Camera = new Three.PerspectiveCamera();

	[Root]: SceneActor = new SceneActor;

	[s_App]: Application | null = null;

	[s_Loaded] = false;

	[s_Created] = false;

	[s_Started] = false;

	[s_Destroyed] = false;

	#grid = new GridActor;
	#ambientLight = new Three.AmbientLight(0xffffff, 1);
	#componentsByTag = new Map<any, ComponentSet<Component>>
	#componentsByType = new Map<any, ComponentSet<Component>>
	#allActors = new ComponentSet<Actor>
	#allBehaviors = new ComponentSet<Behavior>
}

export class SceneActor extends Actor<Three.Scene>
{
	constructor()
	{
		super();
		this.object3d = new Three.Scene;
	}
}
