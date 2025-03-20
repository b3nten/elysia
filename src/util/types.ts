/**
 * Type for objects that can be serialized to JSON or passed to `postMessage`.
 */
export type Serializable =
	| string
	| number
	| boolean
	| null
	| undefined
	| Serializable[]
	| { [key: string]: Serializable };

export type Constructor<T, Args extends any[] = any> = new (...args: Args) => T;

export type AbstractConstructor<T> = abstract new (...args: any[]) => T;

export type ReadonlySet<T> = {
	readonly size: number;
	has(value: T): boolean;
	forEach(
		callbackfn: (value: T, value2: T, set: ReadonlySet<T>) => void,
		thisArg?: any,
	): void;
	entries(): IterableIterator<[T, T]>;
	keys(): IterableIterator<T>;
	values(): IterableIterator<T>;
	[Symbol.iterator](): IterableIterator<T>;
};

export type ReadonlyMap<K, V> = {
	readonly size: number;
	get(key: K): V | undefined;
	has(key: K): boolean;
	forEach(
		callbackfn: (value: V, key: K, map: ReadonlyMap<K, V>) => void,
		thisArg?: any,
	): void;
	entries(): IterableIterator<[K, V]>;
	keys(): IterableIterator<K>;
	values(): IterableIterator<V>;
	[Symbol.iterator](): IterableIterator<[K, V]>;
};
