import { hasKeys } from "../Shared/Asserts.ts";
import { isWorker } from "../Shared/Platform.ts";
import { type EventType } from "./Event.ts";

export interface EventDispatcherArgs {
	/**
	 * Listen to messages from other threads.
	 * If `true`, listens to all messages.
	 * If `"send"`, dispatch events to other threads.
	 * If `"receive"`, listens to messages from other threads.
	 */
	multithreaded?: boolean | "send" | "receive";
	/** Dispatch events to these Workers. */
	workers?: Worker[];
}

/**
 * A synchronous event dispatcher that provides both static and instance-level event handling capabilities.
 * This class allows you to implement a type-safe event system where events can be dispatched and listened to
 * either globally (using static methods) or on specific dispatcher instances.
 *
 * Events can also be dispatched to worker threads provided by the `worker` property (Array or single Worker instance).
 * The event dispatcher can also optionally listen to messages from other threads via the `multithreaded` property.
 * Only `Serializable` events can be dispatched to workers.
 *
 * @example
 * ```typescript
 * // Define your event
 * let UserLoginEvent = createEvent<{ userId: string }>("UserLoginEvent");
 *
 * // Using static (global) event handling
 * const unsubscribeGlobal = EventDispatcher.addEventListener(
 *     UserLoginEvent,
 *     (data) => console.log(`Global: User ${data.userId} logged in`)
 * );
 *
 * // Using instance-based event handling
 * const dispatcher = new EventDispatcher();
 * const unsubscribeInstance = dispatcher.addEventListener(
 *     UserLoginEvent,
 *     (data) => console.log(`Instance: User ${data.userId} logged in`)
 * );
 *
 * // Dispatch events
 * EventDispatcher.dispatchEvent(UserLoginEvent, { userId: "123" });
 * dispatcher.dispatchEvent(UserLoginEvent, { userId: "456" });
 *
 * // Clean up
 * unsubscribeGlobal();
 * unsubscribeInstance();
 *
 * // Or clear all listeners
 * EventDispatcher.clear();     // Clears global listeners
 * dispatcher.clear();                // Clears instance listeners
 * ```
 */
export class EventDispatcher {
	/**
	 * Current workers that the dispatcher is broadcasting to.
	 * Warning: removing workers from this array will not stop the dispatcher from sending messages to them.
	 */
	public readonly workers: Worker[] = [];

	constructor(args: EventDispatcherArgs = {}) {
		this.workers.push(
			...(args.workers
				? Array.isArray(args.workers)
					? args.workers
					: [args.workers]
				: []),
		);

		this.#multithreaded = args.multithreaded;
		if (this.#multithreaded === true || this.#multithreaded === "receive") {
			if (isWorker()) {
				addEventListener("message", this.receiveMessageEvent);
			} else {
				for (const worker of this.workers) {
					worker.addEventListener("message", this.receiveMessageEvent);
				}
			}
		}
	}

	/**
	 * Add an event listener to the static EventDispatcher.
	 * @param type
	 * @param listener
	 */
	static addEventListener<T extends EventType<any>>(
		type: T,
		listener: (value: T extends EventType<infer U> ? U : never) => void,
	): () => void {
		const listeners = this.listeners.get(type) ?? new Set();
		listeners.add(listener);
		this.listeners.set(type, listeners);

		return () => this.removeEventListener(type, listener);
	}

	/**
	 * Add an event listener.
	 * @param type
	 * @param listener
	 */
	addEventListener<T extends EventType<any>>(
		type: T,
		listener: (value: T extends EventType<infer U> ? U : never) => void,
	): () => void {
		const listeners = this.listeners.get(type) ?? new Set();
		listeners.add(listener);
		this.listeners.set(type, listeners);

		return () => this.removeEventListener(type, listener);
	}

	/**
	 * Remove an event listener from the static EventDispatcher.
	 * @param type
	 * @param listener
	 */
	static removeEventListener<T extends EventType<any>>(
		type: T,
		listener: Function,
	): void {
		const listeners = this.listeners.get(type);
		if (!listeners) return;
		listeners.delete(listener);
	}

	/**
	 * Remove an event listener.
	 * @param type
	 * @param listener
	 */
	removeEventListener<T extends EventType<any>>(
		type: T,
		listener: Function,
	): void {
		const listeners = this.listeners.get(type);
		if (!listeners) return;
		listeners.delete(listener);
	}

	/**
	 * Dispatch an event to listeners on the static EventDispatcher.
	 * @param event
	 */
	static dispatchEvent<T extends EventType<any>>(
		event: T,
		data: T extends EventType<infer U> ? U : never,
	) {
		let listeners: Set<Function> | undefined;
		listeners = this.listeners.get(event);
		if (!listeners) return;
		for (const listener of listeners) {
			listener(data);
		}
	}

	/**
	 * Dispatch an event.
	 * @param event
	 */
	dispatchEvent<T extends EventType<any>>(
		event: T,
		data: T extends EventType<infer U> ? U : never,
	) {
		let listeners: Set<Function> | undefined;
		listeners = this.listeners.get(event);

		if (listeners) {
			for (const listener of listeners) {
				listener(data);
			}
		}

		if (
			(this.#multithreaded === true || this.#multithreaded === "send") &&
			isWorker()
		) {
			postMessage({ event, data });
		} else {
			for (const worker of this.workers) {
				worker.postMessage({ event, data });
			}
		}
	}

	/**
	 * Clear all listeners on the static EventDispatcher.
	 */
	static clear() {
		this.listeners.clear();
	}

	/** Clear all listeners. */
	clear() {
		this.listeners.clear();
	}

	protected receiveMessageEvent = (event: MessageEvent<unknown>) => {
		if (!hasKeys(event.data, "event", "data")) return;
		const listener = this.listeners.get(event.data.event as EventType<any>);
		if (!listener) return;
		for (const l of listener) {
			l(event.data.data);
		}
	};

	protected static listeners: Map<EventType<any>, Set<Function>> = new Map();
	protected listeners: Map<EventType<any>, Set<Function>> = new Map();
	#multithreaded?: boolean | "send" | "receive";
}
