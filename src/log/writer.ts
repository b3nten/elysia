/**
 * Interface for implementing logging writers that handle different message severity levels.
 * Writers are responsible for formatting and outputting log messages through various channels.
 */
export interface Writer {
	/**
	 * Logs a general message without specific severity level.
	 * @param message - Array of values to be logged
	 */
	message(message: any[]): void;

	/**
	 * Logs debug-level information, typically used during development.
	 * @param message - Array of values to be logged at debug level
	 */
	debug(message: any[]): void;

	/**
	 * Logs informational messages about system operation.
	 * @param message - Array of values to be logged at info level
	 */
	info(message: any[]): void;

	/**
	 * Logs success messages indicating successful operations or achievements.
	 * @param message - Array of values to be logged as success messages
	 */
	success(message: any[]): void;

	/**
	 * Logs warning messages for potentially problematic situations.
	 * @param message - Array of values to be logged as warnings
	 */
	warn(message: any[]): void;

	/**
	 * Logs error messages for recoverable errors.
	 * @param message - Array of values to be logged as errors
	 */
	error(message: any[]): void;

	/**
	 * Logs critical messages for severe errors that might require immediate attention.
	 * @param message - Array of values to be logged as critical errors
	 */
	critical(message: any[]): void;
}
