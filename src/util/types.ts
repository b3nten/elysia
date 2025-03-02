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