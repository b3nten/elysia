import type { System } from "./System.ts";
import type { Constructor } from "../Core/Utilities.ts"
import * as Internal from "./Internal.ts";
import type { Entity } from "./Entity.ts";
import type { Component } from "./Component.ts";
import type { Destroyable } from "../Core/Lifecycle.ts";
import { SparseSet } from "../Containers/SparseSet.ts";
import { AutoInitializedMap } from "../Containers/AutoInitializedMap.ts";

type Context = {
	delta: number;
	elapsed: number;
	components: AutoInitializedMap<Constructor<Component>, SparseSet<Component>>;
	smallest: (...componentTypes: Constructor<Component>[]) => Constructor<Component>;
}

export class World implements Destroyable
{
	public get active() { return this[Internal.isActive] && !this[Internal.isDestroyed]; }

	public get destroyed() { return this[Internal.isDestroyed]; }

	public get systems() { return this.#systems; }

	public get components() { return this.#components; }

	constructor(...systems: Constructor<System>[])
	{
		for (const system of systems)
		{
			this.addSystem(system);
		}
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
		const componentType = component.constructor as Constructor<Component>;
		const components = this.#components.get(componentType);
		components.add(entity, component);
		for (const system of this.#systems)
		{
			if (system.active)
				system[Internal.onComponentAdded](entity, component);
		}
	}

	removeComponent<T extends Component>(entity: Entity, componentType: Constructor<T>): T | undefined
	{
		const components = this.#components.get(componentType) as SparseSet<T>;
		const removed = components.get(entity);
		components.remove(entity);
		for (const system of this.#systems)
		{
			if (system.active)
				system[Internal.onComponentRemoved](entity, removed);
		}
		return removed;
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
		for(const entity of this.#components.get(componentType))
		{
			yield entity as [number, T];
		}
	}

	/**
	 * Iterate over all entities with all the given components.
	 * @param componentTypes
	 */
	public *iterateByComponents<T extends Component>(...componentTypes: Constructor<T>[]): Generator<number, void, unknown>
	{
		const smallest = this.findSmallestComponent(...componentTypes);
		const components = this.#components.get(smallest);
		for(const entity of components)
		{
			if(componentTypes.every(componentType => this.#components.get(componentType).has(entity[0])))
			{
				yield entity[0];
			}
		}
	}

	/**
	 * From the provided component types, find the component type with the fewest entities.
	 * @param componentTypes
	 */
	public findSmallestComponent<T extends Constructor<Component>>(...componentTypes: T[]): T
	{
		let smallest = componentTypes[0];

		for(const componentType of componentTypes)
		{
			if(!smallest || this.#components.get(componentType).size < this.#components.get(smallest).size)
			{
				smallest = componentType;
			}
		}
		return smallest;
	}

	#systems = new Set<System>;

	#entityCount = 0;

	#components: AutoInitializedMap<Constructor<Component>, SparseSet<Component>> = new AutoInitializedMap(SparseSet);

	[Internal.isActive] = false;

	[Internal.isDestroyed] = false;
}


