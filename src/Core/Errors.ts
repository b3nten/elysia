import { isDev } from "../Shared/Asserts.ts";

export class LifeCycleError extends Error
{
	constructor(method: string, target: any, cause: any)
	{
		super(`Lifecycle error in component: ${String(target?.name)} during ${stripSymbolAndElysia(String(method))}: \n${cause.message}`, {cause});
	}
}

export const reportLifecycleError = <T extends any[]>(context: any, method: (...args: T) => any, ...args: T): any => {
	if(!isDev()) return method.call(context, ...args);
	try
	{
		method.call(context, ...args);
	}
	catch(err)
	{
		if(err instanceof LifeCycleError)
		{
			// @ts-ignore
			err.message = err.message.replace(":", `: ${String(this.constructor.name)} ->`);
			throw err;
		}
		// @ts-ignore
		throw new LifeCycleError(name, this, err);
	}
}

function stripSymbolAndElysia(str: string) {
	if(str.startsWith("Symbol(Elysia::")) { return str.slice(15, -1); }
	else return str;
}
