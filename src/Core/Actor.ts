/**
 * @module Core
 * @description The Actor is the fundamental unit of gameplay in Elysia. Actors have a world transform and can have components attached to them, forming a tree-like hierarchy.
 * Actors participate in the Component lifecycle and will "tick" each frame if they are not specified as `static`.
 * Actors can be queried by a `tag`, an arbitrary piece of data that can be attached to any Actor, or by their type.
 * This allows for Actors to independently implement game logic and manage interactions with other Actors.
 * Like Behaviors, Actors can access their parent actor, scene, and application inside lifecycle callbacks.
 *
 * @example
 * ```ts
 * import { Actor } from "elysia";
 *
 * class Enemy extends Actor
 * {
 * 		onCreate()
 * 		{
 * 			this.addTag("enemy");
 * 			this.addComponent(new HealthComponent);
 * 		}
 * }
 *
 * // potential gameplay logic
 * enemy.getComponentsByType(HealthComponent).first.health = 50;
 * ```
 */

// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';
import { ComponentLifecycle, type IDestroyable } from "./Lifecycle.ts";
import { ELYSIA_LOGGER } from "../Shared/Logger.ts";
import { EventDispatcher } from "../Events/EventDispatcher.ts";
import { ComponentAddedEvent, ComponentRemovedEvent, TagAddedEvent } from "./ElysiaEvents.ts";
import { type Component, isActor } from "./Component.ts";
import type { Scene } from "./Scene.ts";
import type { Application } from "./Application.ts";
import type { Constructor } from "../Shared/Utilities.ts";
import { ComponentSet } from "../Containers/ComponentSet.ts";
import {
	s_App, s_BoundingBox,
	s_ComponentsByTag,
	s_ComponentsByType,
	s_Created,
	s_Destroyed,
	s_Enabled,
	s_InScene,
	s_IsActor,
	s_LocalMatrix,
	s_MatrixDirty,
	s_OnBeforePhysicsUpdate,
	s_OnCreate,
	s_OnDestroy,
	s_OnDisable,
	s_OnEnable,
	s_OnEnterScene,
	s_OnLeaveScene, s_OnPostUpdate,
	s_OnPreUpdate,
	s_OnResize,
	s_OnStart,
	s_OnUpdate,
	s_Parent,
	s_Scene,
	s_Started,
	s_Static,
	s_TransformDirty,
	s_UserEnabled,
	s_WorldMatrix
} from "../Internal/mod.ts";
import { reportLifecycleError } from "./Errors.ts";

/**
 * Base Actor class. Actors are the fundamental unit of gameplay in Elysia.
 */
export class Actor extends ComponentLifecycle implements IDestroyable
{
	/**
	 * Set the actor as static. Static actors and their children do not participate in the update loop, although other lifecycle methods are still called.
	 * onUpdate, onBeforePhysicsUpdate, and onTransformUpdate are not called for static actors or their children.
	 * Other actors can "wake" static actors by setting this to false.
	 * Static actors can improve performance.
	 * @default false
	 */
	get static (): boolean { return this[s_Static]; }
	set static (value: boolean)
	{
		this[s_Static] = value;
		if(this.parent)
		{
			this.parent.components.delete(this);
			this.parent.staticComponents.delete(this);
			if(value)
			{
				this.parent.staticComponents.add(this);
			}
			else
			{
				this.parent.components.add(this);
			}
		}
	}

	/** Whether this actor has finished it's onCreate() lifecycle. */
	get created(): boolean { return this[s_Created]; }

	/** If the actor is enabled. */
	get enabled(): boolean { return this[s_Enabled]; }

	/** Whether this actor has finished it's onStart() lifecycle. */
	get started(): boolean { return this[s_Started]; }

	/** Whether this actor is destroyed */
	get destroyed(): boolean { return this[s_Destroyed]; }

	/** The Application instance of this actor. */
	get app(): Application { return this[s_App]!; }

	/** The Scene instance of this actor. */
	get scene(): Scene { return this[s_Scene]!; }

	/** The parent actor of this actor. */
	get parent(): Actor { return this[s_Parent]!; }

	/** If the transform of the object has changed since the last frame. */
	get transformDirty(): Boolean { return this[s_TransformDirty]; }

	/** The position of this actor. */
	readonly position: ActorVector = new ActorVector;

	/** The rotation of this actor. */
	readonly rotation: ActorQuaternion = new ActorQuaternion;

	/** The scale of this actor. */
	readonly scale: ActorVector = new ActorVector(1,1,1)

	/**
	 * Get the world Matrix4 of this actor.
	 * If the object's transform has been modified, it will recalculate the world matrix of this actor and all its parents.
	 */
	get worldMatrix(): Three.Matrix4
	{
		this.updateWorldMatrix();
		return this[s_WorldMatrix];
	}

	/**
	 * Get the local Matrix4 of this actor.
	 * If the object's transform has been modified, it will recalculate the local matrix of this actor.
	 */
	get localMatrix(): Three.Matrix4
	{
		this.updateWorldMatrix();
		return this[s_LocalMatrix];
	}

	/** The child components of this actor. */
	readonly components: Set<Component> = new Set;

	/** The static components of this actor. */
	readonly staticComponents: Set<Component> = new Set;

	/** The tags of this actor. */
	readonly tags: Set<any> = new Set;

	constructor()
	{
		super();
		this.position.actor = this;
		this.rotation.actor = this;
		this.scale.actor = this;
	}

	/* **********************************************************
	    Public methods
	************************************************************/

	/**
	 * Enables this actor. This means it receives updates and is visible.
	 */
	public enable()
	{
		if(this[s_UserEnabled]) return;
		this[s_UserEnabled] = true;
		this[s_OnEnable]();
	}

	/**
	 * Disables this actor. This means it does not receive updates and is not visible.
	 */
	public disable()
	{
		if(!this[s_UserEnabled]) return;
		this[s_UserEnabled] = false;
		this[s_OnDisable]();
	}

	public getBoundingBox(): Three.Box3
	{
		return this[s_BoundingBox];
	}

	/**
	 * Adds a tag to this actor.
	 * @param tag
	 */
	public addTag(tag: any)
	{
		EventDispatcher.dispatchEvent(new TagAddedEvent({ tag, target: this }));
		this.tags.add(tag);
	}

	/**
	 * Removes a tag from this actor.
	 * @param tag
	 */
	public removeTag(tag: any)
	{
		EventDispatcher.dispatchEvent(new TagAddedEvent({ tag, target: this }));
		this.tags.delete(tag);
	}

	/**
	 * Adds a component to this actor.
	 * @param component
	 * @returns `true` if the component was successfully added, `false` otherwise.
	 */
	public addComponent(component: Component): boolean
	{
		if(this[s_Destroyed])
		{
			ELYSIA_LOGGER.warn("Trying to add component to a destroyed actor");
			return false;
		}
		if(component.destroyed)
		{
			ELYSIA_LOGGER.warn("Trying to add destroyed component to actor");
			return false;
		}

		if(component.static)
		{
			this.staticComponents.add(component);
		}
		else
		{
			this.components.add(component);
		}

		if(!this[s_ComponentsByType].has(component.constructor as Constructor<Component>))
		{
			this[s_ComponentsByType].set(component.constructor as Constructor<Component>, new ComponentSet);
		}

		this[s_ComponentsByType].get(component.constructor as Constructor<Component>)!.add(component);

		if(isActor(component))
		{
			for(const tag of component.tags)
			{
				if(!this[s_ComponentsByTag].has(tag))
				{
					this[s_ComponentsByTag].set(tag, new ComponentSet);
				}
				this[s_ComponentsByTag].get(tag)!.add(component);
			}
			component.markTransformDirty();
		}

		EventDispatcher.dispatchEvent(new ComponentAddedEvent({ parent: this, child: component }));

		component[s_Parent] = this;
		component[s_Scene] = this[s_Scene];
		component[s_App] = this[s_App];

		if(this[s_Created]) component[s_OnCreate]();

		if(this[s_InScene])
		{
			component[s_OnEnterScene]();
			component[s_OnEnable]();
		}

		return true;
	}

	/**
	 * Removes a component from this actor.
	 * @param component
	 * @returns `true` if the component was successfully removed, `false` otherwise.
	 */
	public removeComponent(component: Component): boolean
	{
		if(this[s_Destroyed])
		{
			ELYSIA_LOGGER.warn("Trying to remove component from a destroyed actor");
			return false;
		}

		if(component.destroyed)
		{
			ELYSIA_LOGGER.warn("Trying to remove destroyed component from actor");
			return false;
		}

		EventDispatcher.dispatchEvent(new ComponentRemovedEvent({ parent: this, child: component }));

		this.components.delete(component);
		this.staticComponents.delete(component);

		this[s_ComponentsByType].get(component.constructor as Constructor<Component>)?.delete(component);

		if(isActor(component))
		{
			for(const tag of component.tags)
			{
				this[s_ComponentsByTag].get(tag)?.delete(component);
			}
		}

		component[s_OnLeaveScene]();
		component[s_OnDisable]();

		return true;
	}

	/**
	 * Gets all components of a certain type directly attached to this actor.
	 */
	public getComponentsByType<T extends Component>(type: Constructor<T>): ComponentSet<T>
	{
		const set = (this[s_ComponentsByType].get(type) as ComponentSet<T> | undefined);
		if(!set)
		{
			const newSet = new ComponentSet<T>;
			(this[s_ComponentsByType].set(type, newSet));
			return newSet;
		}
		else return set;
	}

	/**
	 * Gets all components with a certain tag directly attached to this actor.
	 */
	public getComponentsByTag(tag: any): ComponentSet<Component>
	{
		const set = (this[s_ComponentsByTag].get(tag) as ComponentSet<Component> | undefined);
		if(!set)
		{
			const newSet = new ComponentSet<Component>;
			(this[s_ComponentsByTag].set(tag, newSet));
			return newSet;
		}
		else return set;
	}

	/**
	 * Update the world matrix of this actor.
	 * By default will not update if the transform is not dirty.
	 * @param force If true, will update the world matrix even if the transform is not dirty.
	 */
	public updateWorldMatrix(force = false)
	{
		if(!force && !this[s_MatrixDirty]) return;

		this[s_LocalMatrix].compose(this.position, this.rotation, this.scale);

		if(this.parent)
		{
			this[s_WorldMatrix].multiplyMatrices(this.parent.worldMatrix, this[s_LocalMatrix]);
		}
		else
		{
			this[s_WorldMatrix].copy(this[s_LocalMatrix]);
		}

		this[s_MatrixDirty] = false;
	}

	/**
	 * Mark the actor as having a dirty transform.
	 * Usually called when the position, rotation, or scale of the actor is changed, but in
	 * rare cases you might want to call this manually.
	 */
	public markTransformDirty()
	{
		if(!this[s_TransformDirty])
		{
			this[s_TransformDirty] = true;
			for(const component of this.components)
			{
				(component as Actor).markTransformDirty?.();
			}
		}
		// mark matrix dirty as true, will be set to false when the world matrix is accessed/updated
		this[s_MatrixDirty] = true;
	}

	/**
	 * Destroys this actor and all its components.
	 * Recursively destroys all children actors, starting from the deepest children.
	 */
	destructor()
	{
		if(this[s_Destroyed]) return;
		for(const component of this.components)
		{
			component.destructor();
		}
		this[s_OnDisable]();
		this[s_Parent]?.removeComponent(this);
		this[s_OnDestroy]();
		this.position.actor = undefined;
		this.rotation.actor = undefined;
		this.scale.actor = undefined;
		this[s_Parent] = null;
		this[s_Scene] = null;
		this[s_App] = null;
		this[s_Destroyed] = true;
	}

	/* **********************************************************
	    Internal
	************************************************************/

	/** @internal */
	[s_IsActor]: boolean = true;

	/** @internal */
	[s_Parent]: Actor | null = null;

	/** @internal */
	[s_Scene]: Scene | null = null;

	/** @internal */
	[s_App]: Application | null = null;

	/** @internal */
	[s_Static]: boolean = false;

	/** @internal */
	[s_Created]: boolean = false;

	/** @internal */
	[s_Started]: boolean = false;

	/** @internal */
	[s_Enabled]: boolean = false;

	/** @internal */
	[s_UserEnabled]: boolean = true;

	/** @internal */
	[s_InScene]: boolean = false;

	/** @internal */
	[s_Destroyed]: boolean = false;

	/** @internal */
	[s_WorldMatrix]: Three.Matrix4 = new Three.Matrix4();

	/** @internal */
	[s_LocalMatrix]: Three.Matrix4 = new Three.Matrix4();

	// true after the transform has changed, before onTransformChange is called
	/** @internal */
	[s_TransformDirty]: boolean = true;

	// true after the transform has changed,
	// before updateWorldMatrix is called or worldMatrix/localMatrix are accessed
	/** @internal */
	[s_MatrixDirty]: boolean = true;

	/** @internal */
	[s_ComponentsByType]: Map<Constructor<Component>, ComponentSet<Component>> = new Map;

	/** @internal */
	[s_ComponentsByTag]: Map<any, ComponentSet<Component>> = new Map;

	/** @internal */
	[s_BoundingBox]: Three.Box3 = new Three.Box3();

	/** @internal */
	[s_OnEnable]()
	{
		if(this[s_Enabled] || !this[s_UserEnabled]) return;
		this[s_Enabled] = true;
		reportLifecycleError(this, this.onEnable);
		for(const component of this.components) component[s_OnEnable]();
		for(const component of this.staticComponents) component[s_OnEnable]();
	}

	/** @internal */
	[s_OnDisable]()
	{
		if(!this[s_Enabled] || this[s_Destroyed]) return;
		this[s_Enabled] = false;
		reportLifecycleError(this, this.onDisable);
		for(const component of this.components) component[s_OnDisable]();
		for(const component of this.staticComponents) component[s_OnDisable]();
	}

	/** @internal */
	[s_OnCreate]()
	{
		if(this[s_Created]) return;
		if(this[s_Destroyed])
		{
			ELYSIA_LOGGER.warn(`Trying to create a destroyed actor: ${this}`);
			return;
		}
		reportLifecycleError(this, this.onCreate);
		this.app!.renderPipeline.getRenderer().getSize(tempVec2)
		this[s_OnResize](tempVec2.x,tempVec2.y)
		this[s_Created] = true;
		for(const component of this.components)
		{
			component[s_App] = this.app;
			component[s_Scene] = this.scene;
			component[s_Parent] = this;
			if(!component.created) component[s_OnCreate]();
		}
		for(const component of this.staticComponents)
		{
			component[s_App] = this.app;
			component[s_Scene] = this.scene;
			component[s_Parent] = this;
			if(!component.created) component[s_OnCreate]();
		}
	}

	/** @internal */
	[s_OnEnterScene]()
	{
		if(this[s_InScene] || !this[s_Created]) return;
		if(this.destroyed)
		{
			ELYSIA_LOGGER.warn(`Trying to add a destroyed actor to scene: ${this}`);
			return;
		}
		reportLifecycleError(this, this.onEnterScene);
		this[s_InScene] = true;
		for(const component of this.components) component[s_OnEnterScene]();
		for(const component of this.staticComponents) component[s_OnEnterScene]();
	}

	/** @internal */
	[s_OnStart]()
	{
		if(this[s_Started]) return;
		if(!this[s_InScene] || !this.enabled) return;
		if(this[s_Destroyed])
		{
			ELYSIA_LOGGER.warn(`Trying to start a destroyed actor: ${this}`);
			return;
		}
		reportLifecycleError(this, this.onStart);
		this[s_Started] = true;
		for(const component of this.components) if(!component.started) component[s_OnStart]();

	}

	/** @internal */
	[s_OnBeforePhysicsUpdate](delta: number, elapsed: number)
	{
		if(!this[s_Enabled]  || !this[s_InScene]) return;
		if(this.destroyed)
		{
			ELYSIA_LOGGER.warn(`Trying to update a destroyed actor: ${this}`);
			return;
		}
		if(!this[s_Started]) this[s_OnStart]();
		reportLifecycleError(this, this.onBeforePhysicsUpdate, delta, elapsed);
		for(const component of this.components)
		{
			component[s_OnBeforePhysicsUpdate](delta, elapsed);
		}
	}

	/** @internal */
	[s_OnPreUpdate](delta: number, elapsed: number)
	{
		if(!this[s_Enabled] || !this[s_InScene]) return;
		if(this.destroyed)
		{
			ELYSIA_LOGGER.warn(`Trying to update a destroyed actor: ${this}`);
			return;
		}
		reportLifecycleError(this, this.onPreUpdate, delta, elapsed);
		for(const component of this.components) component[s_OnPreUpdate](delta, elapsed);
	}

	/** @internal */
	[s_OnUpdate](delta: number, elapsed: number)
	{
		if(!this[s_Enabled] || !this[s_InScene]) return;
		if(this.destroyed)
		{
			ELYSIA_LOGGER.warn(`Trying to update a destroyed actor: ${this}`);
			return;
		}
		if(this[s_TransformDirty])
		{
			this.onTransformUpdate();
			this[s_TransformDirty] = false;
		}
		reportLifecycleError(this, this.onUpdate, delta, elapsed);
		for(const component of this.components) component[s_OnUpdate](delta, elapsed);
	}

	/** @internal */
	[s_OnPostUpdate](delta: number, elapsed: number)
	{
		if(!this[s_Enabled] || !this[s_InScene]) return;
		if(this.destroyed)
		{
			ELYSIA_LOGGER.warn(`Trying to update a destroyed actor: ${this}`);
			return;
		}
		reportLifecycleError(this, this.onPostUpdate, delta, elapsed);
		for(const component of this.components) component[s_OnPostUpdate](delta, elapsed);
	}

	/** @internal */
	[s_OnLeaveScene]()
	{
		if(this[s_Destroyed]) return;
		if(!this[s_InScene]) return;
		reportLifecycleError(this, this.onLeaveScene);
		this[s_InScene] = false;
		for(const component of this.components) component[s_OnLeaveScene]();
		for(const component of this.staticComponents) component[s_OnLeaveScene]();
	}

	/** @internal */
	[s_OnDestroy]()
	{
		if(this[s_Destroyed]) return;
		reportLifecycleError(this, this.onDestroy)
		this[s_Destroyed] = true;
		for(const component of this.components) component[s_OnDestroy]();
		for(const component of this.staticComponents) component[s_OnDestroy]();
	}

	/** @internal */
	[s_OnResize](width: number, height: number)
	{
		reportLifecycleError(this, this.onResize, width, height);
		for(const component of this.components) component[s_OnResize](width, height);
		for(const component of this.staticComponents) component[s_OnResize](width, height);
	}
}

/** @internal patches Three.Vector to flag parent actor as dirty */
class ActorVector extends Three.Vector3
{
	_x: number;
	_y: number;
	_z: number
	actor?: Actor;

	constructor(x?: number, y?: number, z?: number) {
		super(x, y, z);

		this._x = x ?? 0;
		this._y = y ?? 0;
		this._z = z ?? 0;

		Object.defineProperties(this, {
			x: {
				get() { return this._x },
				set(value)
				{
					this.actor?.markTransformDirty();
					this._x = value
				}
			},
			y: {
				get() { return this._y },
				set(value) {
					this.actor?.markTransformDirty();
					this._y = value
				}
			},
			z: {
				get() { return this._z },
				set(value) {
					this.actor?.markTransformDirty();
					this._z = value
				}
			}
		})
	}
}

/** @internal patches Three.Quaternion to flag parent actor as dirty */
class ActorQuaternion extends Three.Quaternion
{
	actor?: Actor;

	constructor(x?: number, y?: number, z?: number, w?: number) {
		super(x, y, z, w);
	}

	// @ts-ignore
	override _onChangeCallback()
	{
		this.actor?.markTransformDirty();
	}
}

const tempVec2 = new Three.Vector2();