/**
 * @module Logging
 *
 * @description A flexible and extensible logging system that provides different logging levels and output formats.
 * The module includes support for both basic console logging and fancy formatted console output with
 * colors and gradients.
 *
 * Key features:
 * - Multiple severity levels (debug, info, success, warn, error, critical)
 * - Customizable log writers
 * - Support for colored and styled output
 * - Log filtering capabilities
 * - Performance timestamps
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

export { LogLevel } from "./Levels.ts";
export { type Writer } from "./Writer.ts";
export { Logger, createLogger } from "./Logger.ts";
export { gradients } from "./Gradients.ts";
export { FancyConsoleWriter } from "./FancyConsoleWriter.ts";
export { BasicConsoleWriter } from "./BasicConsoleWriter.ts";
