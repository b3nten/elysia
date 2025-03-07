import type { IDestroyable } from "../Core/Lifecycle.ts";
import { isBrowser } from "./Asserts.ts";
import { EventDispatcher } from "../Events/EventDispatcher.ts";
import { createEvent } from "../Events/mod.ts";

export const ResizeEvent = createEvent<{ x: number; y: number }>("ResizeEvent");

export class ResizeController implements IDestroyable {
	width = 0;
	height = 0;

	constructor(private element?: HTMLElement) {
		if (!isBrowser()) return;

		if (element) {
			this.#observer = new ResizeObserver((entries) => {
				const cr = entries[0].contentRect;
				this.width = cr.width;
				this.height = cr.height;
				this.#event.dispatchEvent(ResizeEvent, {
					x: this.width,
					y: this.height,
				});
			});
			this.#observer.observe(element);
			const bounds = element.getBoundingClientRect();
			this.width = bounds.width;
			this.height = bounds.height;

			globalThis.addEventListener("resize", this.#onResize);
		} else {
			this.width = globalThis.innerWidth;
			this.height = globalThis.innerHeight;
		}

		globalThis.addEventListener("resize", this.#onResize);

		this.addEventListener = this.#event.addEventListener.bind(this.#event);
		this.removeEventListener = this.#event.removeEventListener.bind(
			this.#event,
		);
	}

	addEventListener!: EventDispatcher["addEventListener"];

	removeEventListener!: EventDispatcher["removeEventListener"];

	destructor() {
		globalThis.removeEventListener("resize", this.#onResize);
		this.#observer?.disconnect();
		this.#event.clear();
	}

	#event = new EventDispatcher();

	#observer?: ResizeObserver;

	#onResize = (e: Event) => {
		if (this.element) {
			const bounds = this.element.getBoundingClientRect();
			this.width = bounds.width;
			this.height = bounds.height;
			this.#event.dispatchEvent(ResizeEvent, { x: this.width, y: this.height });
		} else {
			this.width = globalThis.innerWidth;
			this.height = globalThis.innerHeight;
			this.#event.dispatchEvent(ResizeEvent, { x: this.width, y: this.height });
		}
	};
}
