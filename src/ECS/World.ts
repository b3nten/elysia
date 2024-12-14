import type { System } from "./System.ts";
import type { Constructor } from "../Shared/Utilities.ts"
import * as Internal from "./Internal.ts";
import type { Entity } from "./Entity.ts";
import type { Component } from "./Component.ts";
import type { IDestroyable } from "../Core/Lifecycle.ts";
import { SparseSet } from "../Containers/SparseSet.ts";
import { AutoInitializedMap } from "../Containers/AutoInitializedMap.ts";
import { getComponentType } from "./Component.ts";

export class World implements IDestroyable
{
	public get active(): boolean { return this[Internal.isActive] && !this[Internal.isDestroyed]; }

	public get destroyed(): boolean { return this[Internal.isDestroyed]; }

	public get systems(): Set<System> { return this.#systems; }

	public get components(): AutoInitializedMap<Constructor<Component>, SparseSet<Component>> { return this.#components; }

	constructor(...systems: Constructor<System>[])
	{
		for (const system of systems)
		{
			this.addSystem(system);
		}
	}

	public addSystem<T extends System, Args extends any[]>(system: Constructor<T, [World, ...Args]>, ...args: Args): T
	{
		const instance = new system(this, ...args);
		this.#systems.add(instance);
		if(this.active) instance[Internal.onStart]();
		return instance;
	}

	public removeSystem<T extends System>(system: T)
	{
		this.#systems.delete(system);
		system.destructor();
	}

	public addEntity(): Entity
	{
		const entity = this.#entityCount++;
		for (const system of this.#systems)
		{
			if (system.active)
				system[Internal.onEntityAdded](entity);
		}
		return entity;
	}

	public removeEntity(entity: Entity)
	{
		// todo: see if there is a faster way to do this
		for(const componentType of this.#components.keys())
		{
			this.removeComponent(entity, componentType);
		}

		for (const system of this.#systems)
		{
			if (system.active)
				system[Internal.onEntityRemoved](entity);
		}
	}

	public addComponent(entity: Entity, component: Component): boolean
	{
		const componentType = getComponentType(component);

		if(this.hasComponent(entity, componentType)) return false;

		const components = this.#components.get(componentType);

		components.add(entity, component);

		for (const system of this.#systems)
		{
			if (system.active)
				system[Internal.onComponentAdded](entity, component);
		}

		return true;
	}

	public removeComponent<T extends Component>(entity: Entity, componentType: Constructor<T>): T | undefined
	{
		const components = this.#components.get(componentType);

		const removed = components.get(entity) as T | undefined;

		if(!removed) return undefined;

		components.remove(entity);

		for (const system of this.#systems)
		{
			if (system.active && removed)
				system[Internal.onComponentRemoved](entity, removed);
		}

		return removed;
	}

	public getComponent<T extends Component>(entity: Entity, componentType: Constructor<T>): T | undefined
	{
		return this.#components.get(componentType).get(entity) as T;
	}

	public hasComponent(entity: Entity, componentType: Constructor<Component>): boolean
	{
		return this.#components.get(componentType).has(entity);
	}

	public getComponentsByType<T extends Component>(componentType: Constructor<T>): SparseSet<T>
	{
		return this.#components.get(componentType) as SparseSet<T>;
	}

	public getComponentCount(componentType: Constructor<Component>): number
	{
		return this.#components.get(componentType).size;
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
			if(!system.active) continue;
			system[Internal.onUpdate](this, delta, elapsed);
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

	/**
	 * Iterate over all entities with the given component.
	 * @param componentType
	 */
	public *iterateByComponent<T extends Component>(componentType: Constructor<T>): Generator<[entity: number, component: T], void, unknown>
	{
		try
		{
			this.#components.get(componentType).lock();
			for(const entity of this.#components.get(componentType))
			{
				yield entity as [number, T];
			}
		}
		finally
		{
			this.#components.get(componentType).unlock();
		}
	}

	[Internal.isActive]: boolean = false;

	[Internal.isDestroyed]: boolean = false;

	#systems: Set<System> = new Set<System>;

	#entityCount: number = 0;

	#components: AutoInitializedMap<Constructor<Component>, SparseSet<Component>> =
		new AutoInitializedMap<Constructor<Component>, SparseSet<Component>>(SparseSet);
}

