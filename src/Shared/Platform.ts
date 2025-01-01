import { hasTTY } from "./Asserts.ts";

const toBoolean = (val: any) => val ? val !== "false" : false;

export function env(): any
{
	// @ts-ignore - Node specific
	return globalThis.process?.env ||
	// @ts-ignore - Deno specific
	import.meta.env ||
	// @ts-ignore - Browser specific
	globalThis.Deno?.env.toObject() ||
	// @ts-ignore - Browser specific
	globalThis.__env__ ||
	globalThis;
}

// @ts-ignore - Deno specific
export function isWindows(): boolean { return /^win/i.test(globalThis.process?.platform || "") }

export function isColorSupported(): boolean
{
	return typeof document !== "undefined" || (!toBoolean(env().NO_COLOR) && (toBoolean(env().FORCE_COLOR) || ((hasTTY() || isWindows()) && env().TERM !== "dumb")))
}

export function isWorker(): boolean
{
	// @ts-ignore - worker only
	return typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
}

export function isSecureContext(): boolean
{
	return typeof window !== "undefined" && globalThis.isSecureContext;
}