/**
 * A simple queue implementation. FIFO.
 */
export class Queue<T>
{
	/**
	 * Return the number of items in the queue.
	 */
	get size(): number { return this.#items.length; }

	/**
	 * Add an item to the queue.
	 * @param item
	 */
	enqueue(item: T): void { this.#items.push(item); }

	/**
	 * Remove and return the first item in the queue.
	 */
	dequeue(): T | undefined { return this.#items.shift(); }

	/**
	 * Return the first item in the queue without removing it.
	 */
	peek(): T | undefined { return this.#items[0]; }

	/**
	 * Check if the queue is empty.
	 */
	isEmpty(): boolean { return this.#items.length === 0; }

	/**
	 * Remove all items from the queue, calling the provided callback for each item.
	 */
	flush(callback: (item: T) => void): void
	{
		while(!this.isEmpty())
		{
			const item = this.dequeue();
			if(item) callback(item);
		}
	}

	/**
	 * Iterate over all items in the queue, removing them as they are yielded
	 * @example
	 * for(const item of queue.iterator())
	 * {
	 *    console.log(item);
	 *    // Do something with item
	 *    // Item is removed from the queue after the loop
	 * }
	 */
	*iterator(): Generator<NonNullable<T>, void, unknown>
	{
		while(!this.isEmpty())
		{
			const item = this.dequeue();
			if(item) yield item;
			if(this.isEmpty()) break;
		}
	}

	/**
	 * Iterate over all items in the queue without removing them.
	 */
	peakIterate(): ArrayIterator<T>
	{
		return this.#items[Symbol.iterator]();
	}

	readonly #items: T[] = [];
}
