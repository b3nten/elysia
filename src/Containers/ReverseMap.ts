/**
 * A Map that allows for reverse lookups of keys by values.
 */
export class ReverseMap<K, V> extends Map<K, V>
{

	/** Get the key for a given value. If the value does not exist in the map, returns undefined. */
	public getKey(value: V): K | undefined
	{
		return this.#reverse.get(value);
	}

	override set(key: K, value: V): this
	{
		super.set(key, value);
		this.#reverse.set(value, key);
		return this;
	}

	#reverse = new Map<V, K>();
}