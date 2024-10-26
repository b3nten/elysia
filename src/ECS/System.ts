import { Destroyable } from "../Core/Lifecycle.ts";
import { Component } from "./Component.ts";
import { Entity } from "./Entity.ts";
import { CatchAndReport } from "./ErrorHandler.ts";
import { World } from "./World.ts";
import * as Internal from "./Internal.ts";

export abstract class System implements Destroyable
{
	protected constructor(protected world: World){}

	abstract readonly name: string;

	public get active() { return this[Internal.isActive] && !this[Internal.isDestroyed]; }

	public get destroyed() { return this[Internal.isDestroyed]; }

	@CatchAndReport
	destructor()
	{
		this[Internal.isDestroyed] = true;
		this[Internal.isActive] = false;
		this.world.removeSystem(this);
	}

	protected abstract query(): Component[];

	protected onEntityAdded?(entity: Entity): void

	protected onEntityRemoved?(entity: Entity): void

	protected onComponentAdded?(entity: Entity, component: Component): void

	protected onComponentRemoved?(entity: Entity, component: Component): void

	protected onStart?(): void

	protected onUpdate?(delta: number, elapsed: number): void

	protected onStop?(): void

	[Internal.isDestroyed] = false;

	[Internal.isActive] = false;

	@CatchAndReport
	[Internal.onStart]() { this.onStart?.(); }

	@CatchAndReport
	[Internal.onUpdate](delta: number, elapsed: number) { this.onUpdate?.(delta, elapsed); }

	@CatchAndReport
	[Internal.onStop]() { this.onStop?.(); }

	@CatchAndReport
	[Internal.onEntityAdded](entity: Entity) { this.onEntityAdded?.(entity); }

	@CatchAndReport
	[Internal.onEntityRemoved](entity: Entity) { this.onEntityRemoved?.(entity); }

	@CatchAndReport
	[Internal.onComponentAdded](entity: Entity, component: Component) { this.onComponentAdded?.(entity, component); }

	@CatchAndReport
	[Internal.onComponentRemoved](entity: Entity, component: Component) { this.onComponentRemoved?.(entity, component); }
}
