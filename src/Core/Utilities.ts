export function toBoolean(val: any): boolean { return val ? val !== "false" : false; }

export function toError(err: unknown): Error
{
	if (err instanceof Error) { return err }
	if(typeof err === 'string') { return new Error(err) }
	return new Error(String(err))
}

export function noop() {}

export type Constructor<T> = new (...args: any[]) => T

export type Maybe<T> = T | null | undefined;

export type MaybePromise<T> = T | Promise<T>;

export type Serializable = string | number | boolean | null | undefined | Serializable[] | { [key: string]: Serializable };

export function tick<T>(callback?: T): T extends Function ? void : Promise<void>
{
	// @ts-ignore
	if(typeof callback === "function") return void setTimeout(callback)
	// @ts-ignore
	else return new Promise<void>(resolve => requestAnimationFrame(() => setTimeout(resolve)))
}

type BoundDecorator = (
	value: Function,
	context: any
) => void | ((...args: any) => any)

/**
 * Binds a method to the instance of the class it is defined in.
 */
export const bound: BoundDecorator = (recever, { name, addInitializer }) => {
	addInitializer(function (this: any) {
		this[name] = this[name].bind(this);
	});
};
