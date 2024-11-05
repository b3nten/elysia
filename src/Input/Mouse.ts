import type { Destroyable } from "../Core/Lifecycle.ts";

/**
 * Observes and manages mouse interactions on a specified HTML element.
 * Tracks mouse position and button states (left, middle, right, and auxiliary buttons).
 * Provides event subscription capabilities for mousemove, mousedown, and mouseup events.
 *
 * @implements {Destroyable}
 * @example
 * ```ts
 * const mouseObserver = new MouseObserver(document.body);
 *
 * // Get current mouse position
 * console.log(mouseObserver.x, mouseObserver.y);
 *
 * // Check button states
 * if (mouseObserver.leftDown) {
 *   // Left mouse button is pressed
 * }
 *
 * // Subscribe to events
 * const cleanup = mouseObserver.addEventListener('mousemove', (event) => {
 *   // Handle mouse movement
 * });
 * ```
 */
export class MouseObserver implements Destroyable
{
	/** Current x position of the mouse cursor. */
	public get x(): number { return this.#x; }
	/** Current y position of the mouse cursor. */
	public get y(): number { return this.#y; }

	/** If the left mouse button (`MouseEvent.button === 0`) is pressed. */
	public get leftDown(): boolean { return this.#mouseDown.left; }
	/** If the middle mouse button (`MouseEvent.button === 1`) is pressed. */
	public get middleDown(): boolean { return this.#mouseDown.middle; }
	/** If the right mouse button (`MouseEvent.button === 2`) is pressed. */
	public get rightDown(): boolean { return this.#mouseDown.right; }
	/** If the fourth auxiliary mouse button (`MouseEvent.button === 3`) is pressed. */
	public get fourDown(): boolean { return this.#mouseDown.four; }
	/** If the fifth auxiliary mouse button (`MouseEvent.button === 4`) is pressed. */
	public get fiveDown(): boolean { return this.#mouseDown.five; }

	constructor(private target: HTMLElement)
	{
		target.addEventListener("mousemove", this.#onMouseMove);
		target.addEventListener("mousedown", this.#onMouseDown);
		target.addEventListener("mouseup", this.#onMouseUp);
	}

	/**
	 * Subscribe to mouse events.
	 * @param type - The type of event to subscribe to.
	 * @param callback - The callback function to be called when the event is triggered.
	*/
	addEventListener(type: "mousemove" | "mousedown" | "mouseup", callback: (event: MouseEvent) => void): () => void
	{
		this.#subscribers.set(type, this.#subscribers.get(type) ?? new Set());
		this.#subscribers.get(type)!.add(callback);
		return () => this.removeEventListener(type, callback);
	}

	/**
	 * Unsubscribe from mouse events.
	 * @param type - The type of event to unsubscribe from.
	 * @param callback - The callback function to be removed.
	*/
	removeEventListener(type: "mousemove" | "mousedown" | "mouseup", callback: (event: MouseEvent) => void): void
	{
		const subs = this.#subscribers.get(type);
		if(subs) {
			subs.delete(callback);
		}
	}

	destructor(): void {
		globalThis.removeEventListener("mousemove", this.#onMouseMove);
		globalThis.removeEventListener("mousedown", this.#onMouseDown);
		globalThis.removeEventListener("mouseup", this.#onMouseUp);
		for(const subs of this.#subscribers.values())
		{
			subs.clear();
		}
	}

	#x = 0;
	#y = 0;
	#subscribers: Map<"mousemove" | "mousedown" | "mouseup", Set<Function>> = new Map;
	#mouseDown = {
		left: false,
		middle: false,
		right: false,
		four: false,
		five: false,
	}

	#onMouseMove = (event: MouseEvent): void => {
		this.#x = event.clientX;
		this.#y = event.clientY;

		const subs = this.#subscribers.get("mousemove");
		if(subs) {
			for(const subscriber of subs) {
				subscriber(event);
			}
		}
	}

	#onMouseDown = (event: MouseEvent): void => {
		const key = event.button;

		switch(key) {
			case 0: this.#mouseDown.left = true; break;
			case 1: this.#mouseDown.middle = true; break;
			case 2: this.#mouseDown.right = true; break;
			case 3: this.#mouseDown.four = true; break;
			case 4: this.#mouseDown.five = true; break;
		}

		const subs = this.#subscribers.get("mousedown");

		if(subs) {
			for(const subscriber of subs) {
				subscriber(event);
			}
		}
	}

	#onMouseUp = (event: MouseEvent): void => {
		const key = event.button;

		switch(key) {
			case 0: this.#mouseDown.left = false; break;
			case 1: this.#mouseDown.middle = false; break;
			case 2: this.#mouseDown.right = false; break;
			case 3: this.#mouseDown.four = false; break;
			case 4: this.#mouseDown.five = false; break;
		}

		const subs = this.#subscribers.get("mouseup");

		if(subs) {
			for(const subscriber of subs) {
				subscriber(event);
			}
		}
	}
}
