/**
 * A map of references to objects.
 */
export class RefMap<T extends WeakKey>
{
	/**
	 * Adds a reference to the map.
	 * @param value The value to add.
	 */
	public add(value: T): WeakRef<T>
	{
		const ref = new WeakRef(value)
		this.map.set(value, ref)
		this.i_values.set(ref, value)
		return ref
	}

	/**
	 * Removes a reference from the map.
	 * @param value The value to remove.
	 */
	public delete(value: WeakRef<T> | T): void
	{
		const ref = value instanceof WeakRef ? value : this.map.get(value)
		if (ref) {
			this.map.delete(this.i_values.get(ref)!)
			this.i_values.delete(ref)
		}
	}

	/**
	 * Checks if a reference is in the map.
	 * @param value The reference to check.
	 * @returns True if the reference is in the map, false otherwise.
	 */
	public has(value: WeakRef<T> | T): boolean
	{
		return value instanceof WeakRef ? this.i_values.has(value) : this.map.has(value)
	}

	/**
	 * Dereferences a reference.
	 * WARNING: Dangerous, only use if you know what you are doing.
	 * @param value
	 */
	public deref(value: WeakRef<T>): T | undefined
	{
		return this.i_values.get(value)
	}

	/**
	 * Returns an iterator over the references in the map.
	 * @returns An iterator over the references in the map.
	 */
	public values(): IterableIterator<WeakRef<T>>
	{
		return this.map.values()
	}

	private readonly map = new Map<T, WeakRef<T>>
	private readonly i_values = new Map<WeakRef<T>, T>
}