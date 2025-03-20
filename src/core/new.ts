import type { Constructor } from "../util/types.ts";
import { Destructible } from "../util/destructible.ts";
import { elysiaLogger } from "./log.ts";

export interface IConstructable<T extends Object = {}> {}

export let makeNew = <T, Args extends any[]>(
	ctor: Constructor<T, Args> | IConstructable<T>,
	...args: Args
) => {
	Destructible.modifyPrototype(ctor);
	return new (<Constructor<T>>ctor)(...args);
};

export let makeNewSafe = <T, Args extends any[]>(
	ctor: Constructor<T, Args>,
	...args: Args
) => {
	try {
		return makeNew(ctor, ...args);
	} catch (e) {
		ELYSIA_DEV: elysiaLogger.error(
			`Error occurred while creating an instance of ${ctor.name}: ${e}`,
		);
	}
};
