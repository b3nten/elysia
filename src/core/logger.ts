import { createLogger, LogLevel } from "../log/logger.ts";

/**
 * @internal
 * Used internally for logging engine stuff.
 */
export let elysiaLogger = createLogger({
	name: "Elysia",
	level: LogLevel.Debug
})
