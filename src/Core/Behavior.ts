import { ActorLifecycle, Destroyable } from "./Lifecycle.ts";
import { Actor } from "./Actor.ts";
import { Scene } from "./Scene.ts";
import { Application } from "./Application.ts";
import { ELYSIA_LOGGER } from "../Shared/Logger.ts";
import { EventDispatcher } from "../Events/EventDispatcher.ts";
import { TagAddedEvent } from "./ElysiaEvents.ts";
import {
	s_App,
	s_Created,
	s_Destroyed,
	s_Enabled,
	s_InScene,
	s_Internal,
	s_IsBehavior,
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
	s_Static,
	s_Tags
} from "../Internal/mod.ts";
import { reportLifecycleError } from "./Errors.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';

/**
 * A behavior is a component that can be attached to an actor to add functionality.
 * It has no children but participates in the actor lifecycle.
 */
export class Behavior implements ActorLifecycle, Destroyable
{
	[s_IsBehavior]: boolean = true;

	/**
	 * Static behaviors are not updated during onUpdate, onBeforePhysicsUpdate, or onTransformUpdate.
	 * This can be toggled at any time.
	 *
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

	/** Enable this behavior. */
	enable() { this[s_OnEnable]() }

	/** Disable this behavior. */
	disable() { this[s_OnDisable]() }

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

	/* **********************************************************
	    Lifecycle methods
	************************************************************/

	onCreate() {}

	onEnterScene() {}

	onEnable() {}

	onStart() {}

	onBeforePhysicsUpdate(delta: number, elapsed: number) {}

	onTransformUpdate() {}

	onUpdate(delta: number, elapsed: number) {}

	onDisable() {}

	onLeaveScene() {}

	onDestroy() {}

	onResize(width: number, height: number) {}

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
	    s_Internal
	************************************************************/

	[s_App]: Application | null = null;

	[s_Scene]: Scene | null = null;

	[s_Parent] : Actor | null = null;

	[s_Tags]:Set<any> = new Set;

	[s_Static] = false;

	[s_Enabled] = true;

	[s_Internal] = { _enabled: false };

	[s_Created] = false;

	[s_Started] = false;

	[s_InScene] = false;

	[s_Destroyed] = false;

	[s_OnEnable](force = false)
	{
		if(!force && !this[s_Enabled]) return;
		if(this[s_Internal]._enabled || this[s_Destroyed])  return;
		this[s_Enabled] = true;
		this[s_Internal]._enabled = true;
		reportLifecycleError(this, this.onEnable);
	}

	[s_OnDisable]()
	{
		if(!this[s_Enabled] || this[s_Destroyed]) return;
		this[s_Enabled] = false;
		reportLifecycleError(this, this.onDisable);
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
		this[s_Created] = true;
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
	}

	[s_OnLeaveScene]()
	{
		if(this[s_Destroyed]) return;
		if(!this[s_InScene]) return;
		reportLifecycleError(this, this.onLeaveScene);
		this[s_InScene] = false;
	}

	[s_OnDestroy]()
	{
		if(this[s_Destroyed]) return;
		reportLifecycleError(this, this.onDestroy)
		this[s_Destroyed] = true;
	}

	[s_OnResize](width: number, height: number)
	{
		reportLifecycleError(this, this.onResize, width, height);
	}
}

const tempVec2 = new Three.Vector2();
