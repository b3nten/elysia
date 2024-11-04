export class SparseSet<T>
{
	get size () { return this.dense.length; }

	get first(): T | undefined
	{
		if(this.size === 0) return undefined;
		return this.components[0];
	}

	add(entity: number, component: T)
	{
		if(this.has(entity)) return;
		const index = this.dense.length;
		this.dense.push(entity);
		this.sparse[entity] = index;
		this.components[index] = component;
	}

	remove(entity: number)
	{
		if(!this.has(entity)) return;
		const index = this.sparse[entity];
		const last = this.dense.pop()!;
		this.dense[index] = last;
		this.sparse[last] = index;
		delete this.sparse[entity];
		delete this.components[index];
	}

	get(entity: number): T | undefined
	{
		if(!this.has(entity)) return undefined;
		return this.components[this.sparse[entity]];
	}

	has(entity: number): boolean
	{
		return this.sparse[entity] !== undefined;
	}

	*[Symbol.iterator](): Iterator<[entity: number, component: T]>
	{
		for(let i = 0; i < this.dense.length; i++)
		{
			yield [this.dense[i], this.components[i]]
		}
	}

	private sparse: number[] = [];
	private dense: number[] = [];
	private components: T[] = [];
}