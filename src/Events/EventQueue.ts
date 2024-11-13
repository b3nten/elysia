import type { BaseEvent } from "./Event.ts";
import type { Constructor } from "../Shared/Utilities.ts";

/**
 * A double-buffered event queue system that manages event dispatching and subscriptions.
 * This class allows you to queue events and dispatch them in a controlled manner, while queueing
 * additional events during processing.
 *
 * @example
 * ```ts
 * // Define an event
 * class UserLoginEvent extends BaseEvent<{ userId: string }> {}
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
export class EventQueue
{

	constructor()
	{
		this.dispatchQueue = this.dispatchQueue.bind(this);
		this.dispatchAndClear = this.dispatchAndClear.bind(this);
		this.clear = this.clear.bind(this);
		this.push = this.push.bind(this);
		this.subscribe = this.subscribe.bind(this);
		this.unsubscribe = this.unsubscribe.bind(this);
		this.iterator = this.iterator.bind(this);
	}

	/**
	 * Push an event to the queue.
	 * @param event
	 */
	public push(event: BaseEvent<any>)
	{
		if(this.hasFlushed)
		{
			this.nextQueue.push(event);
			return;
		}
		this.queue.push(event);
	}

	/**
	 * Iterate over the queue.
	 */
	public iterator(): IterableIterator<BaseEvent<any>>
	{
		return this.queue[Symbol.iterator]();
	}

	/**
	 * Dispatch all events in the queue.
	 */
	public dispatchQueue()
	{
		this.hasFlushed = true;
		for(const event of this.queue)
		{
			const listeners = this.listeners.get(event.constructor as Constructor<BaseEvent<any>>);
			if(!listeners)
			{
				continue;
			}

			for(const listener of listeners)
			{
				try
				{
					listener(event.value);
				}
				catch(e)
				{
					console.error(e);
				}
			}
		}
	}

	/**
	 * Dispatch all events in the queue and clear it.
	 */
	public dispatchAndClear()
	{
		this.dispatchQueue();
		this.clear();
	}

	/**
	 * Clear the queue.
	 */
	public clear()
	{
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
	public subscribe<T extends Constructor<BaseEvent<any>>>(type: T, listener: (value: InstanceType<T>['value']) => void): () => void
	{
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
	public unsubscribe<T extends Constructor<BaseEvent<any>>>(type: T, listener: (value: InstanceType<T>['value']) => void): void
	{
		const listeners = this.listeners.get(type);
		if(!listeners)
		{
			return;
		}

		listeners.delete(listener);
	}

	protected readonly listeners: Map<new (value: any) => BaseEvent<any>, Set<(value: any) => void>> = new Map;

	protected queue: BaseEvent<any>[] = [];

	protected nextQueue: BaseEvent<any>[] = [];

	protected hasFlushed = false;
}
