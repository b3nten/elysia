import type { IDestructible } from "./lifecycle.ts";
import type { Renderer } from "../renderer/interface.ts";
import { Input } from "../input/mod.ts";
import { elysiaLogger } from "./logger.ts";
import type { Scene } from "./scene.ts";
import {CanvasObserver} from "./canvas.ts";
import {isWorker} from "./asserts.ts";

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

export class Application implements IDestructible {

	static get instance() {
		ELYSIA_DEV: if (!Application._instance) {
			throw Error(
				"Attempted to access Application instance before it was initialized."
			);
		}
		return Application._instance;
	}

	static get scene() {
		return Application.instance.scene;
	}

	static get renderer() {
		return Application.instance.renderer;
	}

	// return destructor
	static startMainThread = (
		args: {
			canvas: HTMLCanvasElement | string;
			workers: Worker[];
		}
	): Function => {
		let canvasObserver = new CanvasObserver(
			"mainCanvas",
			typeof args.canvas === "string"
				? document.getElementById(args.canvas) as HTMLCanvasElement
				: args.canvas
		);

		args.workers.forEach((w) => (
			canvasObserver.addWorker(w),
			Input.addWorker(w)
			// Audio.addWorker(w),
		));

		return () => {
			canvasObserver.destructor();
		}
	}

	renderer: Renderer;
	autoUpdate: boolean;
	scene: Scene

	constructor(args: ApplicationArgs) {
		if(Application._instance) {
			elysiaLogger.error("An instance of Application already exists.");
			throw Error("An instance of Application already exists.");
		}

		Application._instance = this;

		this.renderer = args.renderer;
		this._canvas = args.canvas;
		this.autoUpdate = args.autoUpdate ?? false;

		this._canvasObserver = new CanvasObserver("mainCanvas", this._canvas);
		this._canvasObserver.onResize(() => {
			this.renderer?.onCanvasResize(this._canvas.width, this._canvas.height)
			ELYSIA_DEV: elysiaLogger.debug("Canvas resized", this._canvasObserver.width, this._canvasObserver.height);
		});

		ELYSIA_DEV: elysiaLogger.success("Application initialized.");
	}

	destructor() {
		for (let d of [this.renderer]) {
			try {
				d.destructor();
			} catch (e) {
				elysiaLogger.error(e);
			}
		}
	}

	loadScene = async () => {
		await this._canvasObserver.sync();

		// load scene

		// this.renderer.onSceneLoaded(this.scene);
		// this.renderer.onResize(this._canvasObserver.onResize);
	};

	update = () => {
		ELYSIA_DEV: try {

		} catch (e) {

		}

		ELYSIA_PROD: {

		}
	};

	protected static _instance: Application;
	protected _canvas: HTMLCanvasElement;
	protected _canvasObserver: CanvasObserver;
}
