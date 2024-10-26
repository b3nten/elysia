import { ElysiaEvent } from "./Event.ts";
import { Constructor } from "../Core/Utilities.ts";

/**
 * Sync event dispatcher.
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
