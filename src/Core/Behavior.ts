/**
 * @module Core
 * @description Behaviors are the other type of component in Elysia. Unlike {@link Actor}s, behaviors are do not have a transform or child components.
 * Their purpose is to augment the functionality of an actor. Behaviors can be added to actors to add functionality.
 * Like Actors, Behaviors participate in the Component lifecycle and can access the parent actor, scene, and application inside lifecycle callbacks.
 *
 * @example
 * ```ts
 * import { Actor } from "elysia";
 *
 * class HealthComponent extends Behavior
 * {
 * 		health = 100;
 * 		maxHealth = 100;
 *
 * 		onCreate()
 * 		{
 * 			this.health = this.maxHealth;
 * 			this.parent; // access the parent actor
 * 			this.scene; // access the scene
 * 			this.app; // access the application
 * 		}
 * }
 * ```
 */

import { ComponentLifecycle, type IDestroyable } from "./Lifecycle.ts";
import type { Actor } from "./Actor.ts";
import type { Scene } from "./Scene.ts";
import type { Application } from "./Application.ts";
import { ELYSIA_LOGGER } from "../Shared/Logger.ts";
import { EventDispatcher } from "../Events/EventDispatcher.ts";
import { TagAddedEvent } from "./ElysiaEvents.ts";
import {s_App, s_Created, s_Destroyed, s_Enabled, s_InScene, s_IsBehavior, s_OnBeforePhysicsUpdate, s_OnCreate, s_OnDestroy, s_OnDisable, s_OnEnable, s_OnEnterScene, s_OnLeaveScene, s_OnResize, s_OnStart, s_OnUpdate, s_Parent, s_Scene, s_Started, s_Static, s_Tags, s_UserEnabled } from "../Internal/mod.ts";
import { reportLifecycleError } from "./Errors.ts";

/**
 * A behavior is a component that can be attached to an actor to add functionality.
 */
export class Behavior extends ComponentLifecycle implements IDestroyable
{

	/**
	 * Static behaviors are not updated during onUpdate, onBeforePhysicsUpdate, or onTransformUpdate.
	 * This can be toggled at any time.
	 * @default false
	 */
	get static() { return this[s_Static]; }
	set static(value: boolean)
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
	/** If this behavior has completed it's onCreate() lifecycle. */
	get created(): boolean { return this[s_Created]; }

	/** If this behavior has completed it's onStart() lifecycle. */
	get started(): boolean { return this[s_Started]; }

	/** If this behavior has been destroyed. */
	get destroyed(): boolean { return this[s_Destroyed]; }

	/** If this behavior is enabled. */
	get enabled(): boolean { return this[s_Enabled]; }

	/** The parent actor of this behavior. */
	get parent(): Actor { return this[s_Parent]!; }

	/** The scene this behavior belongs to. */
	get scene(): Scene { return this[s_Scene]!; }

	/** The application this behavior belongs to. */
	get app(): Application { return this[s_App]!; }

	/** The tags associated with this behavior. */
	get tags(): Set<any> { return this[s_Tags]; }

	/** Enables this behavior. This means it receives updates and is visible. */
	public enable()
	{
		if(this[s_UserEnabled]) return;
		this[s_UserEnabled] = true;
		this[s_OnEnable]();
	}

	/** Disables this behavior. This means it does not receive updates and is not visible. */
	public disable()
	{
		if(!this[s_UserEnabled]) return;
		this[s_UserEnabled] = false;
		this[s_OnDisable]();
	}

	/**
	 * Adds a tag to this behavior
	 * @param tag
	 */
	addTag(tag: any)
	{
		EventDispatcher.dispatchEvent(new TagAddedEvent({ tag, target: this }));
		this.tags.add(tag);
	}

	/**
	 * Removes a tag from this behavior.
	 * @param tag
	 */
	removeTag(tag: any)
	{
		EventDispatcher.dispatchEvent(new TagAddedEvent({ tag, target: this }));
		this.tags.delete(tag);
	}

	destructor()
	{
		if(this[s_Destroyed]) return;
		this[s_OnLeaveScene]();
		this[s_OnDisable]();
		this[s_OnDestroy]();
		this[s_Parent] = null;
		this[s_Scene] = null;
		this[s_App] = null;
		this[s_Destroyed] = true;
	}

	/* **********************************************************
	    Internal
	************************************************************/

	/** @internal */
	[s_IsBehavior]: boolean = true;

	/** @internal */
	[s_App]: Application | null = null;

	/** @internal */
	[s_Scene]: Scene | null = null;

	/** @internal */
	[s_Parent] : Actor | null = null;

	/** @internal */
	[s_Tags]:Set<any> = new Set;

	/** @internal */
	[s_Static] = false;

	/** @internal */
	[s_Enabled] = false;

	/** @internal */
	[s_UserEnabled] = true;

	/** @internal */
	[s_Created] = false;

	/** @internal */
	[s_Started] = false;

	/** @internal */
	[s_InScene] = false;

	/** @internal */
	[s_Destroyed] = false;

	/** @internal */
	[s_OnEnable]()
	{
		if(this[s_Enabled] || !this[s_UserEnabled]) return;
		this[s_Enabled] = true;
		reportLifecycleError(this, this.onEnable);
	}

	/** @internal */
	[s_OnDisable]()
	{
		if(!this[s_Enabled] || this[s_Destroyed]) return;
		this[s_Enabled] = false;
		reportLifecycleError(this, this.onDisable);
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
		this[s_Created] = true;
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
		if(!this[s_Started]) this[s_OnStart]();
		reportLifecycleError(this, this.onUpdate, delta, elapsed);
	}

	/** @internal */
	[s_OnLeaveScene]()
	{
		if(this[s_Destroyed]) return;
		if(!this[s_InScene]) return;
		reportLifecycleError(this, this.onLeaveScene);
		this[s_InScene] = false;
	}

	/** @internal */
	[s_OnDestroy]()
	{
		if(this[s_Destroyed]) return;
		reportLifecycleError(this, this.onDestroy)
		this[s_Destroyed] = true;
	}

	/** @internal */
	[s_OnResize](width: number, height: number)
	{
		reportLifecycleError(this, this.onResize, width, height);
	}
}
