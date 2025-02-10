import { isDev } from "../Shared/Asserts.ts";

export class LifeCycleError extends Error {
	constructor(method: string, target: string, err: Error) {
		super(
			`In component ${String(target)} during ${String(method)}: ${err.message}\n`,
		);
		this.stack = err.stack;
		this.name = "LifeCycleError";
		this.cause = err.cause;
	}
}

// deno-lint-ignore no-explicit-any
export function reportLifecycleError<T extends any[]>(
	context: any,
	method: (...args: T) => any,
	...args: T
): any {
	// call as normal if not in dev mode
	if (!isDev()) {
		return method.apply(context, args);
	}

	try {
		method.apply(context, args);
	} catch (err) {
		if (err instanceof LifeCycleError) {
			throw err;
		}
		throw new LifeCycleError(
			method.name,
			context.constructor.name,
			err instanceof Error ? err : new Error(String(err)),
		);
	}
}
