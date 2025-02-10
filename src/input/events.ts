// Base event interface with common properties
export interface BaseEvent {
	timeStamp: number;
	type: string;
}

// Keyboard event types
export interface KeyboardBaseEvent extends BaseEvent {
	altKey: boolean;
	ctrlKey: boolean;
	metaKey: boolean;
	shiftKey: boolean;
	key: string;
	code: string;
	repeat: boolean;
	location: number;
}

export interface KeyDownEvent extends KeyboardBaseEvent {
	type: "keydown";
}

export interface KeyUpEvent extends KeyboardBaseEvent {
	type: "keyup";
}

export let makeKeyEvent = (
	event: KeyboardEvent,
): KeyDownEvent | KeyUpEvent => ({
	timeStamp: event.timeStamp,
	type: event.type as "keydown" | "keyup",
	altKey: event.altKey,
	ctrlKey: event.ctrlKey,
	metaKey: event.metaKey,
	shiftKey: event.shiftKey,
	key: event.key,
	code: event.code,
	repeat: event.repeat,
	location: event.location,
});

// Mouse event types
export interface MouseBaseEvent extends BaseEvent {
	altKey: boolean;
	ctrlKey: boolean;
	metaKey: boolean;
	shiftKey: boolean;
	button: number;
	buttons: number;
	// Client coordinates (relative to viewport)
	clientX: number;
	clientY: number;
	// Screen coordinates (relative to user's screen)
	screenX: number;
	screenY: number;
	// Movement since last event
	movementX: number;
	movementY: number;
}

export interface MouseMoveEvent extends MouseBaseEvent {
	type: "mousemove";
}

export interface MouseDownEvent extends MouseBaseEvent {
	type: "mousedown";
}

export interface MouseUpEvent extends MouseBaseEvent {
	type: "mouseup";
}

export let makeMouseEvent = (
	event: MouseEvent,
): MouseMoveEvent | MouseDownEvent | MouseUpEvent => ({
	timeStamp: event.timeStamp,
	type: event.type as "mousemove" | "mousedown" | "mouseup",
	altKey: event.altKey,
	ctrlKey: event.ctrlKey,
	metaKey: event.metaKey,
	shiftKey: event.shiftKey,
	button: event.button,
	buttons: event.buttons,
	clientX: event.clientX,
	clientY: event.clientY,
	screenX: event.screenX,
	screenY: event.screenY,
	movementX: event.movementX,
	movementY: event.movementY,
});

// Wheel event type
export interface MouseWheelEvent extends MouseBaseEvent {
	type: "wheel";
	deltaMode: number;
	deltaX: number;
	deltaY: number;
	deltaZ: number;
}

export let makeWheelEvent = (event: WheelEvent): MouseWheelEvent => ({
	timeStamp: event.timeStamp,
	type: event.type as "wheel",
	altKey: event.altKey,
	ctrlKey: event.ctrlKey,
	metaKey: event.metaKey,
	shiftKey: event.shiftKey,
	button: event.button,
	buttons: event.buttons,
	clientX: event.clientX,
	clientY: event.clientY,
	screenX: event.screenX,
	screenY: event.screenY,
	movementX: event.movementX,
	movementY: event.movementY,
	deltaMode: event.deltaMode,
	deltaX: event.deltaX,
	deltaY: event.deltaY,
	deltaZ: event.deltaZ,
});

// Touch event types
export interface TouchBaseEvent extends BaseEvent {
	altKey: boolean;
	ctrlKey: boolean;
	metaKey: boolean;
	shiftKey: boolean;
	// Simplified touch object
	touches: Array<{
		identifier: number;
		clientX: number;
		clientY: number;
		pageX: number;
		pageY: number;
		screenX: number;
		screenY: number;
		radiusX?: number;
		radiusY?: number;
		rotationAngle?: number;
		force?: number;
	}>;
}

export interface TouchStartEvent extends TouchBaseEvent {
	type: "touchstart";
}

export interface TouchMoveEvent extends TouchBaseEvent {
	type: "touchmove";
}

export interface TouchEndEvent extends TouchBaseEvent {
	type: "touchend";
}

export let makeTouchEvent = (
	event: TouchEvent,
): TouchStartEvent | TouchMoveEvent | TouchEndEvent => ({
	timeStamp: event.timeStamp,
	type: event.type as "touchstart" | "touchmove" | "touchend",
	altKey: event.altKey,
	ctrlKey: event.ctrlKey,
	metaKey: event.metaKey,
	shiftKey: event.shiftKey,
	touches: Array.from(event.touches).map((touch) => ({
		identifier: touch.identifier,
		clientX: touch.clientX,
		clientY: touch.clientY,
		pageX: touch.pageX,
		pageY: touch.pageY,
		screenX: touch.screenX,
		screenY: touch.screenY,
		radiusX: touch.radiusX,
		radiusY: touch.radiusY,
		rotationAngle: touch.rotationAngle,
		force: touch.force,
	})),
});

// Union type of all possible events
export type BrowserEvent =
	| KeyDownEvent
	| KeyUpEvent
	| MouseMoveEvent
	| MouseDownEvent
	| MouseUpEvent
	| MouseWheelEvent
	| TouchStartEvent
	| TouchMoveEvent
	| TouchEndEvent;
