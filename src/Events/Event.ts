import type { Serializable } from "../Shared/Utilities.ts";

/**
 * Base event class that events can be defined from.
 */
export class BaseEvent<T extends unknown>
{
	constructor(public readonly value: T) {}
}

/**
 * Defines a branded event type that augments the string type with value type info.
 */
export type SerializableEvent<T extends Serializable> = string & {
	value: T;
}

/** Create a serializable event type that can be used with EventDispatcher. */
export const createSerializableEvent = <T extends Serializable> (name: string): SerializableEvent<T> => name as SerializableEvent<T>;

/**
 * Generic event to indicate that loading has begun.
 */
export class BeginLoadEvent extends BaseEvent<void> {}

/**
 * Generic event to indicate a progress update.
 */
export class ProgressEvent extends BaseEvent<number> {}

/**
 * Event to indicate that loading has completed.
 */
export class LoadedEvent extends BaseEvent<void> {}

/**
 * Event to indicate an error has occurred.
 */
export class ErrorEvent extends BaseEvent<Error> {}
