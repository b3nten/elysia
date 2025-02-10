import * as events from "./events.ts";
import { isWorker } from "../core/asserts.ts";
import type { WorkerMessageEvent } from "../core/worker.ts";
import type { KeyCode, MouseCode } from "./codes.ts";
import { createEvent } from "../events/event.ts";
import { EventDispatcher } from "../events/dispatcher.ts";

export const MouseEvent = createEvent<
	events.MouseUpEvent | events.MouseDownEvent | events.MouseMoveEvent
>("MouseEvent");
export const WheelEvent = createEvent<events.MouseWheelEvent>("WheelEvent");
export const KeyEvent = createEvent<events.KeyDownEvent | events.KeyUpEvent>(
	"KeyEvent",
);
export const TouchEvent = createEvent<
	events.TouchStartEvent | events.TouchMoveEvent | events.TouchEndEvent
>("TouchEvent");

export class Input {
	static init = (args: { workers?: Worker[] } = {}) => {
		if (isWorker()) {
			postMessage({ type: MESSAGE_TYPES.REGISTER_LISTENER });
			self.addEventListener("message", (e) => {
				this.listenWorker(e);
			});
		} else {
			// not worker
			this.listenMain();
		}
	};

	static isPressed = (key: KeyCode | MouseCode) => {
		return this.keyMap.has(key);
	};

	static eventHandler = new EventDispatcher();
	static on = this.eventHandler.addEventListener;
	static off = this.eventHandler.removeEventListener;

	protected static workers = new Set<Worker>();

	protected static keyMap = new Set<KeyCode | MouseCode>();

	protected static listenMain = () => {
		// listen for worker registration
		window.addEventListener("workerMessage", (e) => {
			let ev = e as WorkerMessageEvent;
			if (ev.detail.data.type === MESSAGE_TYPES.REGISTER_LISTENER) {
				this.workers.add(ev.detail.source);
			}
		});

		for (let eventType of ["keydown", "keyup"]) {
			window.addEventListener(eventType, (e) => {
				let event = events.makeKeyEvent(e as KeyboardEvent);
				this.workers.forEach((w) =>
					w.postMessage({ type: MESSAGE_TYPES.EVENT, event }),
				);
				this.onKeyEvent(event);
			});
		}

		for (let eventType of ["mousemove", "mousedown", "mouseup"]) {
			window.addEventListener(eventType, (e) => {
				let event = events.makeMouseEvent(e as MouseEvent);
				this.workers.forEach((w) =>
					w.postMessage({ type: MESSAGE_TYPES.EVENT, event }),
				);
				this.onMouseEvent(event);
			});
		}

		window.addEventListener("wheel", (e) => {
			let event = events.makeWheelEvent(e as WheelEvent);
			this.workers.forEach((w) =>
				w.postMessage({ type: MESSAGE_TYPES.EVENT, event }),
			);
			this.onWheelEvent(event);
		});

		for (let eventType of ["touchstart", "touchmove", "touchend"]) {
			window.addEventListener(eventType, (e) => {
				let event = events.makeTouchEvent(e as TouchEvent);
				this.workers.forEach((w) =>
					w.postMessage({ type: MESSAGE_TYPES.EVENT, event }),
				);
				this.onTouchEvent(event);
			});
		}
	};

	protected static listenWorker = (e: MessageEvent<any>) => {
		if (e.data.type !== MESSAGE_TYPES.EVENT) return;
		let event = e.data.event;
		if (!event) return;

		switch (event.type) {
			case "keydown":
			case "keyup":
				this.onKeyEvent(event);
				break;
			case "mousemove":
			case "mousedown":
			case "mouseup":
				this.onMouseEvent(event);
				break;
			case "wheel":
				this.onWheelEvent(event);
				break;
			case "touchstart":
			case "touchmove":
			case "touchend":
				this.onTouchEvent(event);
				break;
		}
	};

	protected static onKeyEvent = (
		event: events.KeyDownEvent | events.KeyUpEvent,
	) => {
		if (event.type === "keydown") {
			this.keyMap.add(event.code as KeyCode | MouseCode);
		} else {
			this.keyMap.delete(event.code as KeyCode | MouseCode);
		}
		this.eventHandler.dispatchEvent(KeyEvent, event);
	};

	protected static onMouseEvent = (
		event: events.MouseDownEvent | events.MouseMoveEvent | events.MouseUpEvent,
	) => {
		if (event.type === "mousedown") {
			this.keyMap.add(event.button as KeyCode | MouseCode);
		} else if (event.type === "mouseup") {
			this.keyMap.delete(event.button as KeyCode | MouseCode);
		}
		this.eventHandler.dispatchEvent(MouseEvent, event);
	};

	protected static onWheelEvent = (event: events.MouseWheelEvent) => {
		this.eventHandler.dispatchEvent(WheelEvent, event);
	};

	protected static onTouchEvent = (
		event:
			| events.TouchStartEvent
			| events.TouchMoveEvent
			| events.TouchEndEvent,
	) => {
		this.eventHandler.dispatchEvent(TouchEvent, event);
	};
}

const MESSAGE_TYPES = {
	REGISTER_LISTENER: "InputHandler::RegisterListener",
	EVENT: "InputHandler::MouseEvent",
};
