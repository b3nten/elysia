/**
 * @module
 *
 * Sparse sets are a data structure that allow for constant time addition, removal, and lookup of entities.
 * It packs entities into a dense array, and uses a sparse array to map entities to their index in the dense array.
 * This allows for constant time addition and removal of entities, as well as constant time lookup of entities.
 * Since the dense array is packed, iteration is also faster due to cache locality.
 *
 * @example
 * ```ts
 * const set = new SparseSet<number>();
 * set.add(0, {x: 0, y: 0});
 * set.add(1, {x: 1, y: 1});
 *
 * for(const [entity, component] of set)
 * {
 *    console.log(entity, component);
 *    // 0 {x: 0, y: 0}
 * }
 *
 * set.has(0); // true
 * set.has(2); // false
 * set.get(0); // {x: 0, y: 0}
 * set.remove(0);
 * set.has(0); // false
 * ```
 */

/**
 * A sparse set that stores components of type T.
 * @typeParam T The type of the components to store.
 */
export class SparseSet<T> {
	/**
	 * The number of entities in the set.
	 */
	get size(): number {
		return this.dense.length;
	}

	/**
	 * The first component in the set.
	 */
	get first(): T | undefined {
		if (this.size === 0) return undefined;
		return this.components[0];
	}

	/**
	 * Add an entity and its component to the set.
	 */
	add(entity: number, component: T): boolean {
		if (this.has(entity)) return false;
		if (this.#locked) {
			this.#additionQueue.push(entity, component);
			return true;
		}
		const index = this.dense.length;
		this.dense.push(entity);
		this.sparse[entity] = index;
		this.components[index] = component;
		return true;
	}

	/**
	 * Remove an entity and it's component from the set.
	 */
	remove(entity: number) {
		if (!this.has(entity)) return;
		if (this.#locked) {
			this.#removalQueue.push(entity);
			return;
		}
		const index = this.sparse[entity];
		const last = this.dense.pop()!;
		this.dense[index] = last;
		this.sparse[last] = index;
		delete this.sparse[entity];
		delete this.components[index];
	}

	/**
	 * Get the component of an entity.
	 */
	get(entity: number): T | undefined {
		if (!this.has(entity)) return undefined;
		return this.components[this.sparse[entity]];
	}

	/**
	 * Check if an entity is in the set.
	 */
	has(entity: number): boolean {
		return this.sparse[entity] !== undefined;
	}

	/**
	 * Lock the set. This will queue any additions or removals from taking effect until the set is unlocked.
	 */
	lock() {
		this.#locked = true;
	}

	/**
	 * Unlock the set. This will apply any queued additions or removals.
	 */
	unlock() {
		if (!this.#locked) return;
		this.#locked = false;
		if (this.#additionQueue.length === 0 && this.#removalQueue.length === 0)
			return;
		for (let i = 0; i < this.#additionQueue.length; i += 2) {
			this.add(
				this.#additionQueue[i] as number,
				this.#additionQueue[i + 1] as T,
			);
		}
		this.#additionQueue.length = 0;
		for (let i = 0; i < this.#removalQueue.length; i++) {
			this.remove(this.#removalQueue[i]);
		}
		this.#removalQueue.length = 0;
	}

	/**
	 * Clear the set.
	 */
	clear() {
		this.dense.length = 0;
		this.components.length = 0;
		this.sparse.length = 0;
	}

	/**
	 * Iterate over the set, returning a tuple of the entity and component.
	 */
	*[Symbol.iterator](): Iterator<[entity: number, component: T]> {
		for (let i = 0; i < this.dense.length; i++) {
			yield [this.dense[i], this.components[i]];
		}
	}

	private sparse: number[] = [];
	private dense: number[] = [];
	private components: T[] = [];

	#additionQueue: Array<number | T> = [];
	#removalQueue: number[] = [];
	#locked = false;
}
