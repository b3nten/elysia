import { createLogger, LogLevel } from "../log/logger.ts";

export let elysiaLogger = createLogger({
	name: "Elysia",
	level: LogLevel.Debug,
});

export let SET_ELYSIA_LOGLVL = (level: LogLevel) => {
	elysiaLogger.level = level;
};
