import { AutoInitMap } from "../containers/autoinitmap.ts";
import type { EventType } from "./event.ts";

type RemoveEventListener = () => void;

/**
 * @description LOL
 * @example
 * ```typescript

 * ```
 */
export class EventDispatcher {
	static instance = new EventDispatcher();

	static addEventListener = EventDispatcher.instance.addEventListener;

	static removeEventListener = EventDispatcher.instance.removeEventListener;

	static dispatchEvent = EventDispatcher.instance.dispatchEvent;

	static clear = this.instance.clear;

	/**
	 * Add an event listener.
	 * @param type
	 * @param listener
	 */
	addEventListener = <T extends EventType<any>>(
		type: T,
		listener: (value: T extends EventType<infer U> ? U : never) => void,
	): RemoveEventListener => {
		this.listeners.get(type).add(listener);
		return () => this.removeEventListener(type, listener);
	};

	/**
	 * Remove an event listener.
	 * @param type
	 * @param listener
	 */
	removeEventListener = <T extends EventType<any>>(
		type: T,
		listener: Function,
	): void => {
		ELYSIA_DEV: {
			if (!this.listeners.get(type).has(listener)) {
				console.warn(
					`Attempting to remove a listener (type ${type}) that doesn't exist.`,
				);
			}
		}
		ELYSIA_PROD: {
			this.listeners.get(type).delete(listener);
		}
	};

	/**
	 * Dispatch an event.
	 * @param event
	 * @param data
	 */
	dispatchEvent = <T extends EventType<any>>(
		event: T,
		data: T extends EventType<infer U> ? U : never,
	): void => {
		let listeners = this.listeners.get(event);
		if (ELYSIA_DEV) {
			for (const listener of listeners) {
				try {
					listener(data);
				} catch (cause) {
					throw Error(`Error dispatching event ${event}. ${cause.message}`, {
						cause,
					});
				}
			}
		} else {
			for (const listener of listeners) {
				listener(data);
			}
		}
	};

	/** Clear all listeners. */
	clear = () => this.listeners.clear();

	protected listeners = new AutoInitMap<EventType<any>, Set<Function>>(
		() => new Set(),
	);
}
