import { KeyCode } from "./KeyCode.ts";
import { ObjectPool } from "../Containers/ObjectPool.ts";
import { QueuedEvent } from "./QueuedEvent.ts";
import type { IDestroyable } from "../Core/Lifecycle.ts";
import { MouseObserver } from "./Mouse.ts";
import type { MouseCode } from "./MouseCode.ts";
import {isBrowser} from "@elysiatech/engine/Shared/Asserts.ts";

interface InputQueueConstructorArguments
{
	mouseTarget?: HTMLElement;
	/**
	 * A worker or array of workers to send input events to.
	 */
	worker?: Worker | Worker[]
	/**
	 * Receive input events from the main thread.
	 */
	receiveFromMainThread?: boolean;
}

/**
 * An input management system that queues and processes keyboard and mouse events.
 * It serves as a central hub for handling all input events in the engine, providing:
 *
 * - Event queueing and pooling for efficient memory usage
 * - Unified handling of both keyboard (KeyCode) and mouse (MouseCode) events
 * - Event data including modifier keys and mouse position
 * - Event subscription system for key/button press and release
 *
 * The InputQueue works in conjunction with:
 * - MouseObserver: Handles raw mouse input and tracking
 * - QueuedEvent: Represents pooled input events with full state information
 * - KeyCode/MouseCode: Enums defining all possible input codes
 *
 * Events are processed through an object pool to minimize garbage collection,
 * so event objects should be cloned if they need to persist beyond callback scope.
 *
 * @example
 * ```ts
 * const input = new InputQueue();
 *
 * // Subscribe to keyboard events
 * input.onKeyDown(KeyCode.Space, (event) => {
 *   console.log('Space pressed', event.timestamp);
 * });
 *
 * // Subscribe to mouse events
 * input.onKeyDown(MouseCode.MouseLeft, (event) => {
 *   console.log('Left click at', event.mouseX, event.mouseY);
 * });
 *
 * // Check current state
 * if (input.isDown(KeyCode.W)) {
 *   console.log('W is currently pressed');
 * }
 * ```
 *
 * @implements {IDestroyable}
 */
export class InputQueue implements IDestroyable
{

	public readonly mouse!: MouseObserver;

	constructor(args: InputQueueConstructorArguments = {})
	{
		if(!isBrowser()) return;

		this.mouse = new MouseObserver(args.mouseTarget ?? globalThis.document.body);

		this.keyDownHandler = this.keyDownHandler.bind(this);
		this.keyUpHandler = this.keyUpHandler.bind(this);
		this.mouseDownHandler = this.mouseDownHandler.bind(this);
		this.mouseUpHandler = this.mouseUpHandler.bind(this);

		globalThis.addEventListener("keydown", this.keyDownHandler);
		globalThis.addEventListener("keyup", this.keyUpHandler);
		this.mouse.addEventListener("mousedown", this.mouseDownHandler);
		this.mouse.addEventListener("mouseup", this.mouseUpHandler);
	}

	/**
	 * Add a callback to be called when the specified key or button is pressed.
	 * The QueuedEvent object passed to the callback is part of an object pool and will be freed after the callback returns.
	 * If you need to keep the QueuedEvent object, you must clone it using the clone() method.
	 * @param key The key or button to listen for.
	 * @param callback The callback to call when the key is pressed.
	 * @returns A function that can be called to remove the callback.
	 **/
	public onKeyDown(key: KeyCode | MouseCode, callback: (key: QueuedEvent) => void)
	{
		if(!this.keyDownCallbacks.has(key))
		{
			this.keyDownCallbacks.set(key, new Set);
		}
		this.keyDownCallbacks.get(key)!.add(callback);
	}

	/**
	 * Add a callback to be called when the specified key or button is released.
	 * The QueuedEvent object passed to the callback is part of an object pool and will be freed after the callback returns.
	 * If you need to keep the QueuedEvent object, you must clone it using the clone() method.
	 * @param key The key or button to listen for.
	 * @param callback The callback to call when the key is released.
	 * @returns A function that can be called to remove the callback.
	 **/
	public onKeyUp(key: KeyCode | MouseCode, callback: (key: QueuedEvent) => void)
	{
		if(!this.keyUpCallbacks.has(key))
		{
			this.keyUpCallbacks.set(key, new Set);
		}
		this.keyUpCallbacks.get(key)!.add(callback);
	}

	/** Add a callback to be called when the specified key is pressed or released. */
	public onMouseMove(callback: (event: MouseEvent) => void): () => void { return this.mouse.addEventListener("mousemove", callback); }

	/** Check if a key or mouse button is down. */
	public isDown(key: KeyCode | MouseCode): boolean { return this.currentlyPressed.has(key); }

	/** Flush all events in the queue to their respective listeners, without clearing the queue. */
	public flush(): void
	{
		for(const [key, set] of this.queue)
		{
			for(const event of set)
			{
				if(event.type === "down" && this.keyDownCallbacks.has(key))
				{
					for(const callback of this.keyDownCallbacks.get(key)!)
					{
						callback(event);
					}
				}
				else if(event.type === "up" && this.keyUpCallbacks.has(key))
				{
					for(const callback of this.keyUpCallbacks.get(key)!)
					{
						callback(event);
					}
				}
			}
		}
	}

	/** clear all events in the queue and free them from the pool. */
	public clear(): void
	{
		for(const set of this.queue.values())
		{
			for(const event of set)
			{
				this.pool.free(event);
			}
			set.clear()
		}
	}

	public destructor()
	{
		globalThis.removeEventListener("keydown", this.keyDownHandler)
		globalThis.removeEventListener("keyup", this.keyUpHandler)
		this.mouse.removeEventListener("mousedown", this.mouseDownHandler)
		this.mouse.removeEventListener("mouseup", this.mouseUpHandler)
		this.mouse.destructor()
		this.clear()
		this.keyDownCallbacks.clear()
		this.keyUpCallbacks.clear()
	}

	private pool: ObjectPool<QueuedEvent> = new ObjectPool(() => new QueuedEvent, 50)

	private keyDownCallbacks: Map<KeyCode | MouseCode, Set<(key: QueuedEvent) => void>> = new Map;

	private keyUpCallbacks: Map<KeyCode | MouseCode, Set<(key: QueuedEvent) => void>> = new Map;

	private queue: Map<KeyCode | MouseCode, Set<QueuedEvent>> = new Map;

	private currentlyPressed: Set<KeyCode | MouseCode> = new Set;

	// There is a lot of repetition here, but performance > readability in this case.

	private keyDownHandler(event: KeyboardEvent): void
	{
		const key = event.code as KeyCode;

		if(!this.currentlyPressed.has(key)) {
			this.currentlyPressed.add(key);
			const queued = this.pool.alloc()
			queued.key = key;
			queued.type = "down";
			queued.timestamp = performance.now();
			queued.ctrlDown = event.ctrlKey;
			queued.shiftDown = event.shiftKey;
			queued.spaceDown = this.isDown(KeyCode.Space);
			queued.altDown = event.altKey;
			queued.metaDown = event.metaKey;
			queued.mouseLeftDown = this.mouse.leftDown;
			queued.mouseMidDown = this.mouse.middleDown;
			queued.mouseRightDown = this.mouse.rightDown;
			queued.mouseX = this.mouse.x;
			queued.mouseY = this.mouse.y;

			if(!this.queue.has(key)) {
				this.queue.set(key, new Set);
			}
			this.queue.get(key)!.add(queued);
		}
	}

	private keyUpHandler(event: KeyboardEvent): void
	{
		const key = event.code as KeyCode;

		if(this.currentlyPressed.has(key)) {
			this.currentlyPressed.delete(key);
			const queued = this.pool.alloc()
			queued.key = key;
			queued.type = "up";
			queued.timestamp = performance.now();
			queued.ctrlDown = event.ctrlKey;
			queued.shiftDown = event.shiftKey;
			queued.spaceDown = this.isDown(KeyCode.Space);
			queued.altDown = event.altKey;
			queued.metaDown = event.metaKey;
			queued.mouseLeftDown = this.mouse.leftDown;
			queued.mouseMidDown = this.mouse.middleDown;
			queued.mouseRightDown = this.mouse.rightDown;
			queued.mouseX = this.mouse.x;
			queued.mouseY = this.mouse.y;

			if(!this.queue.has(key)) {
				this.queue.set(key, new Set);
			}
			this.queue.get(key)!.add(queued);
		}
	}

	private mouseDownHandler(event: MouseEvent): void
	{
		const button = event.button as MouseCode;

		if(!this.currentlyPressed.has(button)) {
			this.currentlyPressed.add(button);
			const queued = this.pool.alloc()
			queued.key = button;
			queued.type = "down";
			queued.timestamp = performance.now();
			queued.ctrlDown = event.ctrlKey;
			queued.shiftDown = event.shiftKey;
			queued.spaceDown = this.isDown(KeyCode.Space);
			queued.altDown = event.altKey;
			queued.metaDown = event.metaKey;
			queued.mouseLeftDown = this.mouse.leftDown;
			queued.mouseMidDown = this.mouse.middleDown;
			queued.mouseRightDown = this.mouse.rightDown;
			queued.mouseX = this.mouse.x;
			queued.mouseY = this.mouse.y;

			if(!this.queue.has(button)) {
				this.queue.set(button, new Set);
			}
			this.queue.get(button)!.add(queued);
		}
	}

	private mouseUpHandler(event: MouseEvent): void
	{
		const button = event.button as MouseCode;

		if(this.currentlyPressed.has(button)) {
			this.currentlyPressed.delete(button);
			const queued = this.pool.alloc()
			queued.key = button;
			queued.type = "up";
			queued.timestamp = performance.now();
			queued.ctrlDown = event.ctrlKey;
			queued.shiftDown = event.shiftKey;
			queued.spaceDown = this.isDown(KeyCode.Space);
			queued.altDown = event.altKey;
			queued.metaDown = event.metaKey;
			queued.mouseLeftDown = this.mouse.leftDown;
			queued.mouseMidDown = this.mouse.middleDown;
			queued.mouseRightDown = this.mouse.rightDown;
			queued.mouseX = this.mouse.x;
			queued.mouseY = this.mouse.y;

			if(!this.queue.has(button)) {
				this.queue.set(button, new Set);
			}
			this.queue.get(button)!.add(queued);
		}
	}
}