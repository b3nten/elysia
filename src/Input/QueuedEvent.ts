import { KeyCode } from "./KeyCode.ts";
import { MouseCode } from "./MouseCode.ts";

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
