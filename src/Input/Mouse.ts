import { Destroyable } from "../Core/Lifecycle.ts";

export class MouseObserver implements Destroyable
{

	public get x(): number { return this.#x; }

	public get y(): number { return this.#y; }

	public get leftDown(): boolean { return this.#mouseDown.left; }

	public get middleDown(): boolean { return this.#mouseDown.middle; }

	public get rightDown(): boolean { return this.#mouseDown.right; }

	public get fourDown(): boolean { return this.#mouseDown.four; }

	public get fiveDown(): boolean { return this.#mouseDown.five; }

	constructor(private target: HTMLElement)
	{
		target.addEventListener("mousemove", this.#onMouseMove);
		target.addEventListener("mousedown", this.#onMouseDown);
		target.addEventListener("mouseup", this.#onMouseUp);
	}

	addEventListener(type: "mousemove" | "mousedown" | "mouseup", callback: (event: MouseEvent) => void): () => void
	{
		this.#subscribers.set(type, this.#subscribers.get(type) ?? new Set());
		this.#subscribers.get(type)!.add(callback);
		return () => this.removeEventListener(type, callback);
	}

	removeEventListener(type: "mousemove" | "mousedown" | "mouseup", callback: (event: MouseEvent) => void): void
	{
		const subs = this.#subscribers.get(type);
		if(subs) {
			subs.delete(callback);
		}
	}

	destructor(): void {
		window.removeEventListener("mousemove", this.#onMouseMove);
		for(const subs of this.#subscribers.values()) { subs.clear(); }
	}

	#x = 0;
	#y = 0;
	#mouseDown = {
		left: false,
		middle: false,
		right: false,
		four: false,
		five: false,
	}

	#subscribers: Map<"mousemove" | "mousedown" | "mouseup", Set<Function>> = new Map;

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
