/**
 * SparseSet is a data structure that is used to store a set of unique values.
 * It is backed by a dense array and a sparse map.
 * The dense array stores the values in contiguous memory, while the sparse map
 * stores the index of each value in the dense array.
 * This means it is possible to look up the index of a value in constant time.
 * However, the set does not guarantee the order of the values.
 */
export class ComponentSet<T> extends Set<T>
{
	/**
	 * Returns the first element in the set or undefined if the set is empty.
	 * `O(1)` complexity.
	 */
	get first(): T | undefined
	{
		return this.#first;
	}

	/**
	 * Returns the last element in the set or undefined if the set is empty.
	 * Potentially `O(n)` complexity.
	 */
	get last(): T | undefined
	{
		let result: T | undefined;
		if(this.#last) result = this.#last;
		else for(const value of this) result = value;
		this.#last = result;
		return result;
	}

	public override add(value: T): this
	{
		const result = super.add(value);
		if(result && this.size === 1)
		{
			this.#first = value;
			this.#last = value;
		}
		else if(result) this.#last = value;
		return result;
	}

	public override delete(value: T): boolean
	{
		const result = super.delete(value);
		if(!result) return result;

		if(this.size === 0)
		{
			this.#first = undefined;
			this.#last = undefined;
		}
		else
		{
			if(value === this.#first) this.#first = this.values()?.next()?.value;
			if(result && value === this.#last) this.#last = undefined;
		}
		return result;
	}

	#first: T | undefined;
	#last: T | undefined;
}