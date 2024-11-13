import { KeyCode } from "./KeyCode.ts";
import type { MouseCode } from "./MouseCode.ts";

/**
 * Represents a keyboard or mouse input event with associated state information.
 * Used within an object pool system for efficient event handling.
 * Contains information about:
 * - The key/button that triggered the event
 * - Event type (down/up)
 * - Timestamp of the event
 * - State of modifier keys (ctrl, shift, alt, meta)
 * - State of mouse buttons
 * - Mouse cursor position
 *
 * Note: When received from InputQueue callbacks, instances should be cloned
 * if they need to persist beyond the callback scope, as they will be
 * recycled by the object pool.
 */
export class QueuedEvent
{
	key: KeyCode | MouseCode;
	type: "down" | "up";
	timestamp: number;
	ctrlDown: boolean;
	shiftDown: boolean;
	spaceDown: boolean;
	altDown: boolean;
	metaDown: boolean;
	mouseLeftDown: boolean;
	mouseMidDown: boolean;
	mouseRightDown: boolean;
	mouseX: number;
	mouseY: number;

	constructor(
		key: KeyCode | MouseCode = KeyCode.None,
		type: "down" | "up" = "down",
		timestamp: number = performance.now(),
		ctrlDown: boolean = false,
		shiftDown: boolean = false,
		spaceDown: boolean = false,
		altDown: boolean = false,
		metaDown: boolean = false,
		mouseLeftDown: boolean = false,
		mouseMidDown: boolean = false,
		mouseRightDown: boolean = false,
		mouseX: number = 0,
		mouseY: number = 0,
	) {
		this.key = key;
		this.type = type;
		this.timestamp = timestamp;
		this.ctrlDown = ctrlDown;
		this.shiftDown = shiftDown;
		this.spaceDown = spaceDown;
		this.altDown = altDown;
		this.metaDown = metaDown;
		this.mouseLeftDown = mouseLeftDown;
		this.mouseMidDown = mouseMidDown;
		this.mouseRightDown = mouseRightDown;
		this.mouseX = mouseX;
		this.mouseY = mouseY;
	}

	clone(): QueuedEvent
	{
		return new QueuedEvent(
			this.key,
			this.type,
			this.timestamp,
			this.ctrlDown,
			this.shiftDown,
			this.spaceDown,
			this.altDown,
			this.metaDown,
			this.mouseLeftDown,
			this.mouseMidDown,
			this.mouseRightDown,
			this.mouseX,
			this.mouseY,
		);
	}
}