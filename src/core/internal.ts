import {createLogger, LogLevel} from "../log/logger.ts";

export const ELYSIA_INTERNAL = Symbol.for("elysia-internal");

/**
 * @internal
 * Used internally for logging engine stuff.
 */
export let elysiaLogger = createLogger({
    name: "Elysia",
    level: LogLevel.Debug
})