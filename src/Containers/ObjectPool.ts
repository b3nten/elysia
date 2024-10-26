/**
 * Simple object pool implementation.
 * The pool will automatically grow if it runs out of objects (double the size).
 * @template T The type of object to pool.
 */
export class ObjectPool<T>
{
	/**
	 * Creates a new object pool.
	 * @param factory A function that creates a new object of type T.
	 * @param initialAlloc The initial number of objects to allocate.
	 */
	constructor(private factory: () => T, initialAlloc = 50)
	{
		for (let i = 0; i < initialAlloc; i++) { this.pool.push(this.factory()); }
		this.metrics.allocated = initialAlloc;
	}

	/**
	 * Allocates an object from the pool.
	 * @returns An object of type T.
	 */
	public alloc(): T
	{
		let obj = this.pool.pop();

		if (obj)
		{
			this.metrics.free--;
			return obj;
		}

		const doubled = this.metrics.allocated * 2;

		for (let i = 0; i < doubled; i++)
		{
			this.pool.push(this.factory());
			this.metrics.allocated++
		}

		return this.alloc();
	}

	/**
	 * Frees an object back into the pool.
	 * @param obj The object to free.
	 */
	public free(obj: T)
	{
		this.pool.push(obj);
		this.metrics.free++;
	}

	private metrics = {
		allocated: 0,
		free: 0
	};

	private pool: T[] = [];
}