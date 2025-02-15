import type { Destructible } from "./lifecycle.ts";
import type { Renderer } from "../renderer/interface.ts";
import { Input } from "../input/mod.ts";
import {elysiaLogger} from "./logger.ts";

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

	static instance: Application;

	static {
		// initialize Input.
		// This ensures it's listening for the worker's Input system to register.
		Input.init();
	}

	renderer: Renderer;
	canvas: HTMLCanvasElement;
	autoUpdate: boolean;

	constructor(args: ApplicationArgs) {
		if(Application.instance) {
			elysiaLogger.error("An instance of Application already exists.");
			throw Error("An instance of Application already exists.");
		}

		Application.instance = this;

		this.renderer = args.renderer;
		this.canvas = args.canvas;
		this.autoUpdate = args.autoUpdate ?? false;

		ELYSIA_DEV: elysiaLogger.success("Application initialized.");
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

	loadScene = () => {
		
	};

	update = () => {
		ELYSIA_DEV: try {

		} catch (e) {

		}

		ELYSIA_PROD: {

		}
	};
}
