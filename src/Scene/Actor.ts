// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';
import { ActorLifecycle, Destroyable } from "../Core/Lifecycle.ts";
import { ELYSIA_LOGGER } from "../Core/Logger.ts";
import { ElysiaEventDispatcher } from "../Events/EventDispatcher.ts";
import { ComponentAddedEvent, ComponentRemovedEvent, TagAddedEvent } from "../Core/ElysiaEvents.ts";
import { Component, isActor } from "./Component.ts";
import { Scene } from "./Scene.ts";
import { Application } from "../Core/ApplicationEntry.ts";
import { isDev } from "../Core/Asserts.ts";
import { Constructor } from "../Core/Utilities.ts";
import { ComponentSet } from "../Containers/ComponentSet.ts";
import {
	s_App, s_Created, s_Destroyed, s_Enabled, s_InScene,
	s_Internal,
	s_Object3D,
	s_OnBeforePhysicsUpdate,
	s_OnCreate,
	s_OnDestroy,
	s_OnDisable,
	s_OnEnable,
	s_OnEnterScene,
	s_OnLeaveScene,
	s_OnReparent,
	s_OnResize,
	s_OnStart,
	s_OnUpdate, s_Parent, s_Scene, s_Started
} from "./Internal.ts";
import { reportLifecycleError } from "./Errors.ts";

// internal symbols
export const IsActor = Symbol.for("Elysia::IsActor");
export const s_ComponentsByType = Symbol("Elysia::Actor::ComponentsByType");
export const s_ComponentsByTag = Symbol("Elysia::Actor::ComponentsByTag");

export class Actor<T extends Three.Object3D = Three.Object3D> implements ActorLifecycle, Destroyable
{
	[IsActor]: boolean = true;

	public readonly type: string = "Actor";

	/**
	 * The underlying Three.js object.
	 * This should be used with caution, as it can break the internal state of the actor in some cases.
	 */
	get object3d(): T { return this[s_Object3D]; }
	set object3d(object3d: T) { this.updateObject3d(object3d); }

	/** Whether this actor has finished it's onCreate() lifecycle. */
	get created(): boolean { return this[s_Created]; }

	/** If the actor is enabled. */
	get enabled(): boolean { return this[s_Enabled]; }

	/** Whether this actor has finished it's onStart() lifecycle. */
	get started(): boolean { return this[s_Started]; }

	/** Whether this actor is in the scene. */
	get inScene(): boolean { return this[s_InScene]; }

	/** Whether this actor is destroyed */
	get destroyed(): boolean { return this[s_Destroyed]; }

	/** The Application instance of this actor. */
	get app(): Application { return this[s_App]!; }

	/** The Scene instance of this actor. */
	get scene(): Scene { return this[s_Scene]!; }

	/** The parent actor of this actor. */
	get parent(): Actor { return this[s_Parent]!; }

	/** The position of this actor. */
	get position(): Three.Vector3 { return this[s_Object3D].position; }
	set position(position: Three.Vector3) { this[s_Object3D].position.copy(position); }

	/** The rotation of this actor. */
	get rotation(): Three.Euler { return this[s_Object3D].rotation; }
	set rotation(rotation: Three.Euler) { this[s_Object3D].rotation.copy(rotation); }

	/** The scale of this actor. */
	get scale(): Three.Vector3 { return this[s_Object3D].scale; }
	set scale(scale: Three.Vector3) { this[s_Object3D].scale.copy(scale); }

	/** The quaternion of this actor. */
	get quaternion(): Three.Quaternion { return this[s_Object3D].quaternion; }
	set quaternion(quaternion: Three.Quaternion) { this[s_Object3D].quaternion.copy(quaternion); }

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

	onReparent(parent: Actor | null) {}

	onResize(width: number, height: number) {}

	/* **********************************************************
	    Public methods
	************************************************************/

	updateObject3d(newObject3d: T)
	{
		if(this[s_Object3D] === newObject3d) return;

		const parent = this[s_Object3D].parent;

		this[s_Object3D].parent?.remove(this[s_Object3D]);
		// @ts-ignore - internal augmentation
		this[s_Object3D].actor = undefined;

		// set this actor as the actor of the s_Object3D
		// @ts-ignore - internal augmentation
		newObject3d.actor = this;
		this[s_Object3D] = newObject3d;

		// @ts-ignore - internal augmentation
		if(!newObject3d.hasElysiaEvents) {
			newObject3d.addEventListener("added", (e) =>
			{
				// @ts-ignore - internal augmentation
				newObject3d.actor?.[s_OnEnterScene]();
			})
			newObject3d.addEventListener("removed", (e) =>
			{
				// @ts-ignore - internal augmentation
				newObject3d.actor?.[s_OnLeaveScene]();
			})
			// @ts-ignore - internal augmentation
			newObject3d.hasElysiaEvents = true;
		}

		if(parent)
		{
			parent.add(newObject3d);
		}
	}

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
			if(isActor(component)) this.object3d.add(component.object3d);
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
		isActor(component) && this.object3d.remove(component.object3d);
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
		// @ts-ignore - internal augmentation
		this[s_Object3D].actor = undefined;
		this[s_Object3D].parent?.remove(this[s_Object3D]);
		this[s_Parent] = null;
		this[s_Scene] = null;
		this[s_App] = null;
		this[s_Destroyed] = true;
	}

	/* **********************************************************
	    s_Internal
	************************************************************/

	// @ts-ignore - internal augmentation
	[s_Object3D] = ((e: Three.Object3D) => (e.actor = this, e))(new Three.Object3D) as T;

	[s_Parent]: Actor | null = null;

	[s_Scene]: Scene | null = null;

	[s_App]: Application | null = null;

	[s_Created]: boolean = false;

	[s_Started]: boolean = false;

	[s_Enabled]: boolean = true;

	[s_Internal] = { _enabled: false };

	[s_InScene]: boolean = false;

	[s_Destroyed]: boolean = false;

	[s_ComponentsByType]: Map<Constructor<Component>, ComponentSet<Component>> = new Map;

	[s_ComponentsByTag]: Map<any, ComponentSet<Component>> = new Map;

	[s_OnEnable](force = false)
	{
		if(!force && !this[s_Enabled]) return;
		if(this[s_Internal]._enabled || this[s_Destroyed])  return;
		this[s_Enabled] = true;
		this[s_Internal]._enabled = true;
		this.object3d.visible = true;
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
		this.object3d.visible = false;
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
			if(isActor(component)) this.object3d.add(component.object3d);
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
			if(isActor(component)) component.object3d.removeFromParent()
		}
	}

	[s_OnDestroy]()
	{
		if(this[s_Destroyed]) return;
		reportLifecycleError(this, this.onDestroy)
		this[s_Destroyed] = true;
		for(const component of this.components) component[s_OnDestroy]();
	}

	[s_OnReparent](newParent: Actor | null)
	{
		if(newParent === this[s_Parent])
		{
			if(isDev()) ELYSIA_LOGGER.warn(`Trying to reparent actor to the same parent: ${this}`);
		}
		this[s_Parent] = newParent;
		reportLifecycleError(this, this.onReparent, newParent);
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

const tempVec2 = new Three.Vector2();
