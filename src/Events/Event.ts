/**
 * Base event class that events are derived from.
 */
export class ElysiaEvent<T extends unknown>
{
	public timestamp: number = performance.now();
	constructor(public readonly value: T) {}
}

/**
 * Generic event to indicate that loading has begun.
 */
export class BeginLoadEvent extends ElysiaEvent<void> {}

/**
 * Generic event to indicate a progress update.
 */
export class ProgressEvent extends ElysiaEvent<number> {}

/**
 * Event to indicate that loading has completed.
 */
export class LoadedEvent extends ElysiaEvent<void> {}

/**
 * Event to indicate an error has occurred.
 */
export class ErrorEvent extends ElysiaEvent<Error> {}

