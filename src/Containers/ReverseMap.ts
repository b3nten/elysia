/**
 * @module
 *
 * This data structure can be used as an ordinary Map, but allows for reverse lookups of keys by values.
 * Useful for storing bi-directional relationships between objects.
 *
 * @example
 * ```ts
 * const map = new ReverseMap<string, number>();
 * map.set("a", 1);
 * map.set("b", 2);
 * map.set("c", 3);
 *
 * console.log(map.get("a")); // 1
 * console.log(map.getKey(2)); // "b"
 * ```
 */

/**
 * A Map that allows for reverse lookups of keys by values.
 */
export class ReverseMap<K, V> extends Map<K, V> {
	/** Get the key for a given value. If the value does not exist in the map, returns undefined. */
	public getKey(value: V): K | undefined {
		return this.#reverse.get(value);
	}

	override set(key: K, value: V): this {
		super.set(key, value);
		this.#reverse.set(value, key);
		return this;
	}

	#reverse = new Map<V, K>();
}
