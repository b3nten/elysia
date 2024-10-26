import { System } from "./System.ts";
import { Constructor } from "../Core/Utilities.ts"
import * as Internal from "./Internal.ts";
import { Entity } from "./Entity.ts";
import { Component } from "./Component.ts";
import { Destroyable } from "../Core/Lifecycle.ts";

export class World implements Destroyable
{
	public get active() { return this[Internal.isActive] && !this[Internal.isDestroyed]; }

	public get destroyed() { return this[Internal.isDestroyed]; }

	constructor()
	{

	}

	public addSystem<T extends System>(system: Constructor<T>): T
	{
		const instance = new system(this);
		this.#systems.add(instance);
		if(this.active) instance[Internal.onStart]();
		return instance;
	}

	public removeSystem<T extends System>(system: T)
	{
		this.#systems.delete(system);
		system.destructor();
	}

	addEntity(): Entity
	{
		const entity = this.#entityCount++;
		for (const system of this.#systems)
		{
			if (system.active)
				system[Internal.onEntityAdded](entity);
		}
		return entity;
	}

	removeEntity(entity: Entity)
	{
		for (const system of this.#systems)
		{
			if (system.active)
				system[Internal.onEntityRemoved](entity);
		}
	}

	addComponent(entity: Entity, component: Component)
	{
		for (const system of this.#systems)
		{
			if (system.active)
				system[Internal.onComponentAdded](entity, component);
		}
	}

	removeComponent(entity: Entity, component: Component)
	{
		for (const system of this.#systems)
		{
			if (system.active)
				system[Internal.onComponentRemoved](entity, component);
		}
	}

	public start()
	{
		if (this[Internal.isActive]) return;
		this[Internal.isActive] = true;
		for (const system of this.#systems)
		{
			if(!system.active && !system.destroyed)
			{
				system[Internal.isActive] = true;
				system[Internal.onStart]();
			}
		}
	}

	public update(delta: number, elapsed: number)
	{
		if (!this[Internal.isActive] || this[Internal.isDestroyed]) return;
		for (const system of this.#systems)
		{
			// need to match queries here
			if(system.active)
				system[Internal.onUpdate](delta, elapsed);
		}
	}

	public stop()
	{
		if (!this[Internal.isActive] || this[Internal.isDestroyed]) return;
		this[Internal.isActive] = false;
		for (const system of this.#systems)
		{
			if(system.active)
			{
				system[Internal.isActive] = false;
				system[Internal.onStop]();
			}
		}
	}

	public destructor(): void {
		if (this[Internal.isDestroyed]) return;
		this[Internal.isDestroyed] = true;
		this[Internal.isActive] = false;
		for (const system of this.#systems)
		{
			system.destructor();
		}
	}

	#systems = new Set<System>;

	#entityCount = 0;

	[Internal.isActive] = false;

	[Internal.isDestroyed] = false;
}
