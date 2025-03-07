import * as events from "./events.ts";
import { isWorker } from "../util/asserts.ts";
import { createWorker, workerMain, type WorkerProxy } from "../util/worker.ts";
import type { KeyCode, MouseCode } from "./codes.ts";
import { createEvent } from "../events/event.ts";
import { EventDispatcher } from "../events/dispatcher.ts";

import {elysiaLogger} from "../core/internal.ts";

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
	static isPressed = (key: KeyCode | MouseCode) => {
		return this.keyMap.has(key);
	};

	static eventHandler = new EventDispatcher;

	static on: EventDispatcher["addEventListener"] = this.eventHandler.addEventListener.bind(this.eventHandler);

	static off: EventDispatcher["removeEventListener"] = this.eventHandler.removeEventListener.bind(this.eventHandler);

	static addWorker = (worker: Worker) => {
		if(isWorker())
			throw Error("Cannot add worker to Input in a worker.");

		this.workers.add(createWorker(worker));
	}

	protected static workers = new Set<WorkerProxy>();

	protected static keyMap = new Set<KeyCode | MouseCode>();

	protected static listenMain = () => {
		elysiaLogger.debug("Listening for input events on main thread.");
		for (let eventType of ["keydown", "keyup"]) {
			window.addEventListener(eventType, (e) => {
				let event = events.makeKeyEvent(e as KeyboardEvent);
				Input.onKeyEvent(event);
				Input.workers.forEach((w) => {
					w.input.onKeyEvent(event)
				});
			});
		}

		for (let eventType of ["mousemove", "mousedown", "mouseup"]) {
			window.addEventListener(eventType, (e) => {
				let event = events.makeMouseEvent(e as MouseEvent);
				Input.workers.forEach((w) => {
					w.input.onMouseEvent(event)
				});
				Input.onMouseEvent(event);
			});
		}

		window.addEventListener("wheel", (e) => {
			let event = events.makeWheelEvent(e as WheelEvent);
			Input.workers.forEach((w) => w.input.onWheelEvent(event));
			Input.onWheelEvent(event);
		});

		for (let eventType of ["touchstart", "touchmove", "touchend"]) {
			window.addEventListener(eventType, (e) => {
				let event = events.makeTouchEvent(e as TouchEvent);
				Input.workers.forEach((w) => w.input.onTouchEvent(event));
				Input.onTouchEvent(event);
			});
		}
	};

	protected static listenWorker = () => {
		workerMain.input.onKeyEvent.$subscribe(this.onKeyEvent);
		workerMain.input.onMouseEvent.$subscribe(this.onMouseEvent);
		workerMain.input.onWheelEvent.$subscribe(this.onWheelEvent);
		workerMain.input.onTouchEvent.$subscribe(this.onTouchEvent);
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

	static {
		if (isWorker()) {
			Input.listenWorker();
		} else {
			Input.listenMain();
		}
	}
}
