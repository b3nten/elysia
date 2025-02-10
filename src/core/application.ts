import type { Destructible } from "./lifecycle.ts";
import type { Renderer } from "../renderer/interface.ts";
import { Input } from "../input/mod.ts";

interface ApplicationArgs {
	/** A renderer that satisfies the Renderer interface */
	renderer: Renderer;
	/** The canvas element to render to. */
	canvas: HTMLCanvasElement;
	/**
	 *  If the application should automatically update.
	 *  This is useful if you don't have any other logic running
	 *  per-frame and want to let Elysia handle the update loop.
	 *  @default false
	 */
	autoUpdate?: boolean;
}

export class Application implements Destructible {
	static {
		Input.init();
	}

	renderer: Renderer;
	canvas: HTMLCanvasElement;
	autoUpdate: boolean;

	constructor(args: ApplicationArgs) {
		this.renderer = args.renderer;
		this.canvas = args.canvas;
		this.autoUpdate = args.autoUpdate ?? false;
	}

	destructor() {
		for (let d of [this.renderer]) {
			try {
				d.destructor();
			} catch (e) {
				console.error(e);
			}
		}
	}

	loadScene = () => {};

	update = () => {
		// if(ELYSIA_DEV) {
		// 	try {
		//
		// 	} catch (e) {
		// 		console.error(e);
		// 	}
		// } else {
		//
		// }
	};
}
