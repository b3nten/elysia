/**
 * @module Events
 *
 * @description This module provides event handling functionality.
 * It includes base event types, synchronous event dispatching, and event queuing capabilities.
 *
 * Core Components:
 *
 * 1. Base Events (event.ts):
 * - EventType<T>: Type for events
 * - createEvent<T>: Base class for all events with generic type support
 * - unwrapEvent<T>: Unwrap an event to its payload
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
 * let MyEvent = createEvent<string>("MyEvent")
 *
 * // Using the dispatcher
 * const dispatcher = new EventDispatcher();
 * dispatcher.addEventListener(MyEvent, (message) => console.log(message));
 * dispatcher.dispatchEvent(MyEvent, "Hello!");
 *
 * // Using the queue
 * const queue = new EventQueue();
 * queue.subscribe(MyEvent, (message) => console.log(message));
 * queue.push(MyEvent, "Queued message");
 * queue.dispatchQueue();
 * ```
 *
 * @typicaluse
 * - Real-time event handling / cross thread communication: Use EventDispatcher
 * - Batched processing: Use EventQueue
 * - Loading operations: Use built-in events (BeginLoadEvent, ProgressEvent, etc.)
 */

/**
 * Base Event type
 */
export * from "./Event.ts";
export { EventDispatcher, type EventDispatcherArgs } from "./EventDispatcher.ts";
export { EventQueue } from "./EventQueue.ts";
