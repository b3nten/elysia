import {createLogger, LogLevel} from "../log/logger.ts";
import {Actor} from "./actor.ts";
import {ObjectState} from "./lifecycle.ts";

export const ELYSIA_INTERNAL = Symbol.for("elysia-internal");

export function ASSERT_INTERNAL<T extends Object>(obj: T): asserts obj is { [ELYSIA_INTERNAL]: any } & T {
    if(!(ELYSIA_INTERNAL in obj)) {
        throw new Error("Object does not have ELYSIA_INTERNAL property");
    }
}

/**
 * @internal
 * Used internally for logging engine stuff.
 */
export let elysiaLogger = createLogger({
    name: "Elysia",
    level: LogLevel.Debug
})

export class ElysiaInternalIObject {
    tags = new Set;
    state = ObjectState.Inactive;
    parent: Actor | null = null;
    ctor: any;
    constructor(
        ctor: any,
        parent: Actor | null = null
    ) {
        this.parent = parent;
        this.ctor = ctor;
    }
}