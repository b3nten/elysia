import type { EventType } from "./Event.ts";

/**
 * A double-buffered event queue system that manages event dispatching and subscriptions.
 * This class allows you to queue events and dispatch them in a controlled manner, while queueing
 * additional events during processing.
 *
 * @example
 * ```ts
 * // Define an event
 * let UserLoginEvent = createEvent<{ userId: string }>("userLoginEvent")
 *
 * // Create the event queue
 * const eventQueue = new EventQueue();
 *
 * // Subscribe to events
 * const unsubscribe = eventQueue.subscribe(UserLoginEvent, (data) => {
 *     console.log(`User logged in: ${data.userId}`);
 * });
 *
 * // Push events to the queue
 * eventQueue.push(new UserLoginEvent({ userId: "123" }));
 *
 * // Process all queued events
 * eventQueue.dispatchQueue();
 *
 * // Do other work here that can read the queue.
 *
 * // Clean up the queue and prepare for next batch
 * eventQueue.clear();
 *
 * // Unsubscribe when done
 * unsubscribe();
 * ```
 */
export class EventQueue {
	/**
	 * Push an event to the queue.
	 * @param event
	 */
	public push(event: EventType<any>) {
		if (this.hasFlushed) {
			this.nextQueue.push(event);
			return;
		}
		this.queue.push(event);
	}

	/**
	 * Iterate over the queue.
	 */
	public iterator(): IterableIterator<EventType<any>> {
		return this.queue[Symbol.iterator]();
	}

	/**
	 * Dispatch all events in the queue.
	 */
	public dispatchQueue() {
		this.hasFlushed = true;
		for (const event of this.queue) {
			const listeners = this.listeners.get(event);
			if (!listeners) {
				continue;
			}
			for (const listener of listeners) {
				try {
					listener(event);
				} catch (e) {
					console.error(e);
				}
			}
		}
	}

	/**
	 * Dispatch all events in the queue and clear it.
	 */
	public dispatchAndClear() {
		this.dispatchQueue();
		this.clear();
	}

	/**
	 * Clear the queue.
	 */
	public clear() {
		const temp = this.queue;
		temp.length = 0;
		this.queue = this.nextQueue;
		this.nextQueue = temp;
		this.hasFlushed = false;
	}

	/**
	 * Subscribe to an event.
	 * @param type
	 * @param listener
	 */
	public subscribe<T extends EventType<any>>(
		type: T,
		listener: (value: T["__type"]) => void,
	): () => void {
		const listeners = this.listeners.get(type) ?? new Set();
		listeners.add(listener);
		this.listeners.set(type, listeners);

		return () => void this.unsubscribe(type, listener);
	}

	/**
	 * Unsubscribe from an event.
	 * @param type
	 * @param listener
	 */
	public unsubscribe<T extends EventType<any>>(
		type: T,
		listener: (value: T["__type"]) => void,
	): void {
		const listeners = this.listeners.get(type);
		if (!listeners) {
			return;
		}

		listeners.delete(listener);
	}

	protected readonly listeners: Map<EventType<any>, Set<(value: any) => void>> =
		new Map();

	protected queue: EventType<any>[] = [];

	protected nextQueue: EventType<any>[] = [];

	protected hasFlushed = false;
}
