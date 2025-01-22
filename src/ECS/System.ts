import type { IDestroyable } from "../Core/Lifecycle.ts";
import type { Component } from "./Component.ts";
import type { Entity } from "./Entity.ts";
import { CatchAndReport } from "./ErrorHandler.ts";
import type { World } from "./World.ts";
import * as Internal from "./Internal.ts";
import { uuid } from "../Shared/Utilities.ts";

export abstract class System implements IDestroyable {
	constructor(protected world: World) {}

	abstract readonly name: string;

	public get active(): boolean {
		return this[Internal.isActive] && !this[Internal.isDestroyed];
	}

	public get destroyed(): boolean {
		return this[Internal.isDestroyed];
	}

	destructor() {
		this[Internal.isDestroyed] = true;
		this[Internal.isActive] = false;
		this.world.removeSystem(this);
	}

	protected onEntityAdded?(entity: Entity): void;

	protected onEntityRemoved?(entity: Entity): void;

	protected onComponentAdded?(entity: Entity, component: Component): void;

	protected onComponentRemoved?(entity: Entity, component: Component): void;

	protected onStart?(): void;

	protected onUpdate?(context: World, delta: number, elapsed: number): void;

	protected onStop?(): void;

	[Internal.isDestroyed]: boolean = false;

	[Internal.isActive]: boolean = false;

	[Internal.uuid]: string = uuid();

	[Internal.onStart]() {
		this.onStart?.();
	}

	[Internal.onUpdate](context: World, delta: number, elapsed: number) {
		this.onUpdate?.(context, delta, elapsed);
	}

	[Internal.onStop]() {
		this.onStop?.();
	}

	[Internal.onEntityAdded](entity: Entity) {
		this.onEntityAdded?.(entity);
	}

	[Internal.onEntityRemoved](entity: Entity) {
		this.onEntityRemoved?.(entity);
	}

	[Internal.onComponentAdded](entity: Entity, component: Component) {
		this.onComponentAdded?.(entity, component);
	}

	[Internal.onComponentRemoved](entity: Entity, component: Component) {
		this.onComponentRemoved?.(entity, component);
	}
}
