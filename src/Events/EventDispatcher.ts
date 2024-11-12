import { ElysiaEvent } from "./Event.ts";
import { Constructor } from "../Shared/Utilities.ts";

/**
 * A synchronous event dispatcher that provides both static and instance-level event handling capabilities.
 * This class allows you to implement a type-safe event system where events can be dispatched and listened to
 * either globally (using static methods) or on specific dispatcher instances.
 *
 * @example
 * ```typescript
 * // Define your event
 * class UserLoginEvent extends ElysiaEvent<{ userId: string }> {}
 *
 * // Using static (global) event handling
 * const unsubscribeGlobal = ElysiaEventDispatcher.addEventListener(
 *     UserLoginEvent,
 *     (data) => console.log(`Global: User ${data.userId} logged in`)
 * );
 *
 * // Using instance-based event handling
 * const dispatcher = new ElysiaEventDispatcher();
 * const unsubscribeInstance = dispatcher.addEventListener(
 *     UserLoginEvent,
 *     (data) => console.log(`Instance: User ${data.userId} logged in`)
 * );
 *
 * // Dispatch events
 * ElysiaEventDispatcher.dispatchEvent(new UserLoginEvent({ userId: "123" }));
 * dispatcher.dispatchEvent(new UserLoginEvent({ userId: "456" }));
 *
 * // Clean up
 * unsubscribeGlobal();
 * unsubscribeInstance();
 *
 * // Or clear all listeners
 * ElysiaEventDispatcher.clear();     // Clears global listeners
 * dispatcher.clear();                // Clears instance listeners
 * ```
 */
export class ElysiaEventDispatcher
{

	/**
	 * Add an event listener.
	 * @param type
	 * @param listener
	 */
	static addEventListener<T extends Constructor<ElysiaEvent<any>>>(type: T, listener: (value: InstanceType<T>['value']) => void): () => void
	{
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
	addEventListener<T extends Constructor<ElysiaEvent<any>>>(type: T, listener: (value: InstanceType<T>['value']) => void): () => void
	{
		const listeners = this.listeners.get(type) ?? new Set();
		listeners.add(listener);
		this.listeners.set(type, listeners);

		return () => this.removeEventListener(type, listener);
	}

	/**
	 * Remove an event listener.
	 * @param type
	 * @param listener
	 */
	static removeEventListener<T extends Constructor<ElysiaEvent<any>>>(type: T, listener: (value: InstanceType<T>['value']) => void): void
	{
		const listeners = this.listeners.get(type);
		if(!listeners)
		{
			return;
		}

		listeners.delete(listener);
	}

	/**
	 * Remove an event listener.
	 * @param type
	 * @param listener
	 */
	removeEventListener<T extends Constructor<ElysiaEvent<any>>>(type: T, listener: (value: InstanceType<T>['value']) => void): void
	{
		const listeners = this.listeners.get(type);
		if(!listeners)
		{
			return;
		}

		listeners.delete(listener);
	}

	/**
	 * Dispatch an event.
	 * @param event
	 */
	static dispatchEvent<T extends Constructor<ElysiaEvent<any>>>(event: InstanceType<T>)
	{
		const listeners = this.listeners.get(event.constructor as T);

		if(!listeners)
		{
			return;
		}

		for(const listener of listeners)
		{
			try
			{
				listener(event.value);
			}
			catch (e)
			{
				console.error(e);
			}
		}
	}

	/**
	 * Dispatch an event.
	 * @param event
	 */
	dispatchEvent<T extends Constructor<ElysiaEvent<any>>>(event: InstanceType<T>)
	{
		const listeners = this.listeners.get(event.constructor as T);

		if(!listeners)
		{
			return;
		}

		for(const listener of listeners)
		{
			try
			{
				listener(event.value);
			}
			catch (e)
			{
				console.error(e);
			}
		}
	}

	/**
	 * Clear all listeners.
	 */
	static clear() { this.listeners.clear(); }

	/**
	 * Clear all listeners.
	 */
	clear() { this.listeners.clear(); }

	private static listeners = new Map<Constructor<ElysiaEvent<any>>, Set<Function>>;
	private listeners = new Map<Constructor<ElysiaEvent<any>>, Set<Function>>;
}
