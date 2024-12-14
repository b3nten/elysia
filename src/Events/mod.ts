/**
 * @module Events
 *
 * @description This module provides event handling functionality.
 * It includes base event types, synchronous event dispatching, and event queuing capabilities.
 *
 * Core Components:
 *
 * 1. Base Events (Event.ts):
 * - BaseEvent<T>: Base class for all events with generic type support
 * - BeginLoadEvent: Signals the start of a loading operation
 * - ProgressEvent: Reports progress updates
 * - LoadedEvent: Signals completion of loading
 * - ErrorEvent: Reports error conditions
 *
 * 2. Event Dispatcher (EventDispatcher.ts):
 * EventDispatcher provides immediate, synchronous event handling with:
 * - Static and instance-based event dispatch
 * - Type-safe event listener registration
 * - Automatic error handling for listeners
 *
 * 3. Event Queue (EventQueue.ts):
 * EventQueue implements a double-buffered event queue system for:
 * - Controlled event processing
 * - Deferred event handling
 * - Safe event accumulation during processing
 *
 * @example Basic Event Usage
 * ```typescript
 * // Define a custom event
 * class MyEvent extends BaseEvent<string> {}
 * // Define a serialized event
 * const SerializedEvent = createSerializableEvent<string>("SerializedEvent");
 *
 * // Using the dispatcher
 * const dispatcher = new EventDispatcher();
 * dispatcher.addEventListener(MyEvent, (message) => console.log(message));
 * dispatcher.addEventListener(SerializedEvent, (data) => console.log(data));
 * dispatcher.dispatchEvent(new MyEvent("Hello!"));
 * dispatcher.dispatchEvent(SerializedEvent, "Serialized message");
 *
 * // Using the queue
 * const queue = new EventQueue();
 * queue.subscribe(MyEvent, (message) => console.log(message));
 * queue.push(new MyEvent("Queued message"));
 * queue.dispatchQueue();
 * ```
 *
 * @typicaluse
 * - Real-time event handling / cross thread communication: Use EventDispatcher
 * - Batched processing: Use EventQueue
 * - Loading operations: Use built-in events (BeginLoadEvent, ProgressEvent, etc.)
 */

export { ProgressEvent, ErrorEvent, LoadedEvent, BeginLoadEvent, BaseEvent, type SerializableEvent, createSerializableEvent } from "./Event.ts";
export { EventQueue } from "./EventQueue.ts";
export { EventDispatcher, type EventDispatcherConstructorArgs } from "./EventDispatcher.ts";
