/**
 * @module
 *
 * An often used data structure is a Map that contains other data structures such as Sets.
 * This class is a Map that automatically initializes a data structure for a key on access if it doesn't exist.
 *
 * @example
 * ```ts
 * const map = new AutoInitializedMap<string, Set<number>>(Set);
 * map.get("key").add(1);
 * map.has("foo"); // true
 */

import { Constructor } from "../Shared/Utilities.ts";

/**
 * A map of sets which automatically initializes a set for a key if it doesn't exist.
 */
export class AutoInitializedMap<K, V> extends Map
{
	/**
	 * Whether the map has a set for the given key.
	 * Will always return true.
	 * @param key
	 */
	public override has(key: K): boolean { return true; }

	/**
	 * Get the set for the given key.
	 * @param key
	 */
	public override get(key: K): V
	{
		if(this.exists(key))
		{
			return super.get(key);
		}
		else
		{
			this.set(key, new this.ConstructorType);
			return super.get(key);
		}
	}

	/**
	 * Check if the map has a set for the given key.
	 * Unlike `has()`, it will return false if the value for a given key has not been initialized yet.
	 * @param key
	 */
	public exists(key: K): boolean
	{
		return super.has(key);
	}

	/**
	 * A map of sets which automatically initializes a set for a key if it doesn't exist.
	 * @param ConstructorType The constructor for the set to use.
	 */
	constructor(ConstructorType: Constructor<V>)
	{
		super()
		this.ConstructorType = ConstructorType;
	}

	private readonly ConstructorType: Constructor<V>
}