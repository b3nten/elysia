import type { EventType } from "./event.ts";
import { AutoInitMap } from "../containers/autoinitmap.ts";

/**
 * @description
 * @example
 * ```ts
 *
 * ```
 */
export class EventQueue {
	protected static instance = new EventQueue;

	static push = EventQueue.instance.push;

	static iterator = EventQueue.instance.iterator;

	static dispatchQueue = EventQueue.instance.dispatchQueue;

	static dispatchAndClear = EventQueue.instance.dispatchAndClear;

	static clear = EventQueue.instance.clear;

	static subscribe = EventQueue.instance.subscribe;

	/**
	 * Push an event to the queue.
	 * @param event
	 */
	push = (event: EventType<any>) => {
		if (this.hasFlushed) {
			this.nextQueue.push(event);
			return;
		}
		this.queue.push(event);
	}

	/**
	 * Dispatch all events in the queue.
	 */
	dispatchQueue = () => {
		this.hasFlushed = true;
		for (let event of this.queue) {
			let listeners = this.listeners.get(event);
			for (const listener of listeners) {
				if (ELYSIA_DEV) {
					try {
						listener(event);
					} catch (cause) {
						throw Error(`Error calling queued event ${event}`, { cause });
					}
				} else {
					listener(event);
				}
			}
		}
	}

	/**
	 * Dispatch all events in the queue and clear it.
	 */
	dispatchAndClear = () => {
		this.dispatchQueue();
		this.clear();
	}

	/**
	 * Clear the queue.
	 */
	clear = () => {
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
	subscribe = <T extends EventType<any>>(
		type: T,
		listener: (value: T["__type"]) => void,
	): () => void => {
		this.listeners.get(type).add(listener);
		return () => void this.unsubscribe(type, listener);
	}

	/**
	 * Unsubscribe from an event.
	 * @param type
	 * @param listener
	 */
	unsubscribe = <T extends EventType<any>>(
		type: T,
		listener: (value: T["__type"]) => void,
	): void => {
		this.listeners.get(type).delete(listener);
	}

	/**
	 * Iterate over the queue.
	 */
	iterator = () => {
		return this.queue[Symbol.iterator]();
	}

	protected readonly listeners = new AutoInitMap<
		EventType<any>,
		Set<(value: any) => void>
	>(() => new Set());

	protected queue: EventType<any>[] = [];

	protected nextQueue: EventType<any>[] = [];

	protected hasFlushed = false;
}
