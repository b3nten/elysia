/**
 * @module Events
 * This module provides event handling functionality.
 * It includes base event types, synchronous event dispatching, and event queuing capabilities.
 *
 * Core Components:
 *
 * 1. Base Events (Event.ts):
 * - ElysiaEvent<T>: Base class for all events with generic type support
 * - BeginLoadEvent: Signals the start of a loading operation
 * - ProgressEvent: Reports progress updates
 * - LoadedEvent: Signals completion of loading
 * - ErrorEvent: Reports error conditions
 *
 * 2. Event Dispatcher (EventDispatcher.ts):
 * ElysiaEventDispatcher provides immediate, synchronous event handling with:
 * - Static and instance-based event dispatch
 * - Type-safe event listener registration
 * - Automatic error handling for listeners
 *
 * 3. Event Queue (EventQueue.ts):
 * ElysiaEventQueue implements a double-buffered event queue system for:
 * - Controlled event processing
 * - Deferred event handling
 * - Safe event accumulation during processing
 *
 * @example Basic Event Usage
 * ```typescript
 * // Define a custom event
 * class MyEvent extends ElysiaEvent<string> {}
 *
 * // Using the dispatcher
 * const dispatcher = new ElysiaEventDispatcher();
 * dispatcher.addEventListener(MyEvent, (message) => console.log(message));
 * dispatcher.dispatchEvent(new MyEvent("Hello!"));
 *
 * // Using the queue
 * const queue = new ElysiaEventQueue();
 * queue.subscribe(MyEvent, (message) => console.log(message));
 * queue.push(new MyEvent("Queued message"));
 * queue.flush();
 * ```
 *
 * @typicaluse
 * - Real-time event handling: Use ElysiaEventDispatcher
 * - Batched processing: Use ElysiaEventQueue
 * - Loading operations: Use built-in events (BeginLoadEvent, ProgressEvent, etc.)
 */

export * from "./mod.ts";
export * from "./EventQueue.ts";
export * from "./Event.ts";
export * from "./EventDispatcher.ts";
