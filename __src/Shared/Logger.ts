import { createLogger, LogLevel } from "../Logging/Logger.ts";
import type { Logger } from "../Logging/Logger.ts";

export const ELYSIA_LOGGER: Logger = createLogger({
	level: LogLevel.Silent,
	name: "ELYSIA",
});

export function SET_ELYSIA_LOGLEVEL(level: LogLevel) {
	ELYSIA_LOGGER.level = level;
}
