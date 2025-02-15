/**
 * @module Logging
 *
 * @description A logging system that provides different logging levels and output formats.
 * The module includes support for both basic console logging and fancy formatted console output with
 * colors and gradients.
 *
 * @example Basic Usage
 * ```ts
 * const logger = createLogger({ name: "MyApp" });
 *
 * // Log messages with different severity levels
 * logger.info("Application started");
 * logger.debug("Debug information");
 * logger.error("An error occurred:", error);
 * ```
 * @example Custom Configuration
 * ```ts
 * const logger = createLogger({
 *   name: "MyApp",
 *   level: LogLevel.Debug,
 *   color: [[255, 0, 0], [0, 0, 255]], // Red to Blue gradient
 * });
 * ```
 * @example Filters
 * ```ts
 * FILTER_LOGS("MyApp", "Network");
 *
 * // Clear filters
 * FILTER_LOGS(null);
 * ```
 * @see {@link Writer} for the writer interface specification
 * @see {@link BasicConsoleWriter} for basic console output implementation
 * @see {@link FancyConsoleWriter} for styled console output implementation
 * @see {@link LogLevel} for available logging levels
 * @see {@link Logger} for the main logger class
 *
 */

export { LogLevel } from "./levels.ts";
export type { Writer } from "./writer.ts";
export { Logger, createLogger } from "./logger.ts";
export { gradients } from "./gradients.ts";
export { FancyConsoleWriter } from "./fancyConsoleWriter.ts";
export { BasicConsoleWriter } from "./basicConsoleWriter.ts";
