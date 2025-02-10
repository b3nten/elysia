import { AutoInitMap } from "../containers/autoinitmap.ts";
import type { EventType } from "./event.ts";

/**
 * @description LOL
 * @example
 * ```typescript

 * ```
 */
export class EventDispatcher {
	static global = new EventDispatcher();

	/**
	 * Add an event listener.
	 * @param type
	 * @param listener
	 */
	addEventListener = <T extends EventType<any>>(
		type: T,
		listener: (value: T extends EventType<infer U> ? U : never) => void,
	): (() => void) => {
		this.listeners.get(type).add(listener);
		return () => this.removeEventListener(type, listener);
	};

	static addEventListener = EventDispatcher.global.addEventListener;

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

	static removeEventListener = EventDispatcher.global.removeEventListener;

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

	static dispatchEvent = EventDispatcher.global.dispatchEvent;

	/** Clear all listeners. */
	clear = () => this.listeners.clear();

	static clear = this.global.clear;

	protected listeners = new AutoInitMap<EventType<any>, Set<Function>>(
		() => new Set(),
	);
}
