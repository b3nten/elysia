// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';
import type { ActorLifecycle, Destroyable } from "../Core/Lifecycle.ts";
import { ELYSIA_LOGGER } from "../Core/Logger.ts";
import { ElysiaEventDispatcher } from "../Events/EventDispatcher.ts";
import { ComponentAddedEvent, ComponentRemovedEvent, TagAddedEvent } from "../Core/ElysiaEvents.ts";
import { type Component, isActor } from "./Component.ts";
import type { Scene } from "./Scene.ts";
import type { Application } from "../Core/ApplicationEntry.ts";
import type { Constructor } from "../Core/Utilities.ts";
import { ComponentSet } from "../Containers/ComponentSet.ts";
import {
	s_App,
	s_ComponentsByTag,
	s_ComponentsByType,
	s_Created,
	s_Destroyed,
	s_Enabled,
	s_InScene,
	s_Internal,
	s_IsActor,
	s_LocalMatrix,
	s_OnBeforePhysicsUpdate,
	s_OnCreate,
	s_OnDestroy,
	s_OnDisable,
	s_OnEnable,
	s_OnEnterScene,
	s_OnLeaveScene,
	s_OnResize,
	s_OnStart,
	s_OnUpdate,
	s_Parent,
	s_Scene,
	s_Started,
	s_TransformDirty,
	s_WorldMatrix
} from "./Internal.ts";
import { reportLifecycleError } from "./Errors.ts";

const tempVec2 = new Three.Vector2();

export class Actor implements ActorLifecycle, Destroyable
{
	[s_IsActor]: boolean = true;

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

	/** The position of this actor. */
	readonly position = new ActorVector;

	/** The rotation of this actor. */
	readonly rotation = new ActorQuaternion;

	/** The scale of this actor. */
	readonly scale = new ActorVector(1,1,1)

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

	/** The tags of this actor. */
	readonly tags: Set<any> = new Set;

	/* **********************************************************
	    Lifecycle methods
	************************************************************/

	onCreate() {}

	onEnable() {}

	onStart() {}

	onEnterScene() {}

	onBeforePhysicsUpdate(delta: number, elapsed: number) {}

	onUpdate(delta: number, elapsed: number) {}

	onLeaveScene() {}

	onDisable() {}

	onDestroy() {}

	onResize(width: number, height: number) {}

	constructor()
	{
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
	enable() { this[s_OnEnable](true); }

	/**
	 * Disables this actor. This means it does not receive updates and is not visible.
	 */
	disable() { this[s_OnDisable](); }

	/**
	 * Adds a tag to this actor.
	 * @param tag
	 */
	addTag(tag: any)
	{
		ElysiaEventDispatcher.dispatchEvent(new TagAddedEvent({ tag, target: this }));
		this.tags.add(tag);
	}

	/**
	 * Removes a tag from this actor.
	 * @param tag
	 */
	removeTag(tag: any)
	{
		ElysiaEventDispatcher.dispatchEvent(new TagAddedEvent({ tag, target: this }));
		this.tags.delete(tag);
	}

	/**
	 * Adds a component to this actor.
	 * @param component
	 * @returns `true` if the component was successfully added, `false` otherwise.
	 */
	addComponent(component: Component): boolean
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

		this.components.add(component);

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
		}

		ElysiaEventDispatcher.dispatchEvent(new ComponentAddedEvent({ parent: this, child: component }));

		component[s_Parent] = this;
		component[s_Scene] = this[s_Scene];
		component[s_App] = this[s_App];

		if(this[s_Created]) component[s_OnCreate]();

		if(this[s_InScene])
		{
			component[s_OnEnterScene]();
		}

		if(this[s_InScene] && this[s_Enabled]) component[s_OnEnable]();

		return true;
	}

	/**
	 * Removes a component from this actor.
	 * @param component
	 * @returns `true` if the component was successfully removed, `false` otherwise.
	 */
	removeComponent(component: Component): boolean
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

		ElysiaEventDispatcher.dispatchEvent(new ComponentRemovedEvent({ parent: this, child: component }));

		this.components.delete(component);

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
	getComponentsByType<T extends Component>(type: Constructor<T>): ComponentSet<T>
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
	getComponentsByTag(tag: any): ComponentSet<Component>
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
		if(!force && !this[s_TransformDirty]) return;

		this[s_LocalMatrix].compose(this.position, this.rotation, this.scale);

		if(this.parent)
		{
			this[s_WorldMatrix].multiplyMatrices(this.parent.worldMatrix, this[s_LocalMatrix]);
		}
		else
		{
			this[s_WorldMatrix].copy(this[s_LocalMatrix]);
		}

		this[s_TransformDirty] = false;
	}

	/**
	 * Mark the actor as having a dirty transform.
	 * Usually called when the position, rotation, or scale of the actor is changed, but in
	 * rare cases you might want to call this manually.
	 */
	public markTransformDirty()
	{
		if(this[s_TransformDirty]) return;
		this[s_TransformDirty] = true;
		for(const component of this.components)
		{
			// no need to check, if it's not an actor it will just ignore it
			(component as Actor).markTransformDirty?.();
		}
	}

	/**
	 * Destroys this actor and all its components.
	 * Recursively destroys all children actors, starting from the deepest children.
	 */
	destructor() {
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

	[s_Parent]: Actor | null = null;

	[s_Scene]: Scene | null = null;

	[s_App]: Application | null = null;

	[s_Created]: boolean = false;

	[s_Started]: boolean = false;

	[s_Enabled]: boolean = true;

	[s_Internal] = { _enabled: false };

	[s_InScene]: boolean = false;

	[s_Destroyed]: boolean = false;

	[s_TransformDirty] = true;

	[s_WorldMatrix] = new Three.Matrix4();

	[s_LocalMatrix] = new Three.Matrix4();

	[s_ComponentsByType]: Map<Constructor<Component>, ComponentSet<Component>> = new Map;

	[s_ComponentsByTag]: Map<any, ComponentSet<Component>> = new Map;

	[s_OnEnable](force = false)
	{
		if(!force && !this[s_Enabled]) return;
		if(this[s_Internal]._enabled || this[s_Destroyed])  return;
		this[s_Enabled] = true;
		this[s_Internal]._enabled = true;
		reportLifecycleError(this, this.onEnable);
		for(const component of this.components)
		{
			component[s_OnEnable]();
		}
	}

	[s_OnDisable]()
	{
		if(!this[s_Enabled] || this[s_Destroyed]) return;
		this[s_Enabled] = false;
		this[s_Internal]._enabled = false;
		reportLifecycleError(this, this.onDisable);
		for(const component of this.components)
		{
			component[s_OnDisable]();
		}
	}

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
	}

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
		for(const component of this.components)
		{
			component[s_OnEnterScene]();
		}
	}

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
		for(const component of this.components)
		{
			if(!component.started) component[s_OnStart]();
		}
	}

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

	[s_OnUpdate](delta: number, elapsed: number)
	{
		if(!this[s_Enabled] || !this[s_InScene]) return;
		if(this.destroyed)
		{
			ELYSIA_LOGGER.warn(`Trying to update a destroyed actor: ${this}`);
			return;
		}
		if(!this[s_Started]) this[s_OnStart]();
		reportLifecycleError(this, this.onUpdate, delta, elapsed);
		for(const component of this.components)
		{
			component[s_OnUpdate](delta, elapsed);
		}
	}

	[s_OnLeaveScene]()
	{
		if(this[s_Destroyed]) return;
		if(!this[s_InScene]) return;
		reportLifecycleError(this, this.onLeaveScene);
		this[s_InScene] = false;
		for(const component of this.components)
		{
			component[s_OnLeaveScene]();
		}
	}

	[s_OnDestroy]()
	{
		if(this[s_Destroyed]) return;
		reportLifecycleError(this, this.onDestroy)
		this[s_Destroyed] = true;
		for(const component of this.components) component[s_OnDestroy]();
	}

	[s_OnResize](width: number, height: number)
	{
		reportLifecycleError(this, this.onResize, width, height);
		for(const component of this.components)
		{
			component[s_OnResize](width, height);
		}
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
				set(value) {
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