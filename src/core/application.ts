import {
	type IDestructible,
	mainUpdateActor,
	ObjectState,
	postUpdateActor,
	preUpdateActor,
	startActor
} from "./lifecycle.ts";
import type { Renderer } from "../renderer/mod.ts";
import { Input } from "../input/mod.ts";
import type { Scene } from "./scene.ts";
import {CanvasObserver} from "../util/canvas.ts";
import {ELYSIA_INTERNAL, elysiaLogger} from "./internal.ts";
import {Clock} from "./clock.ts";
import type {Constructor} from "../util/types.ts";

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

	get scene() {
		return this._scene;
	}

	get paused() {
		return this._paused;
	}

	set paused(value: boolean) {
		if(value && !this._paused) {
			// pause actors
		} else if (!value && this._paused) {
			// play actors
		}
		this._paused = value;
	}

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
			this._sizeHasChanged = true;
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

	loadScene = async (scene: Constructor<Scene>) => {
		await this._canvasObserver.sync();

		if(this._scene) {
			await this._sceneLoadPromise;
			this._scene.destructor();
		}

		this._scene = new scene();

		this._sceneLoadPromise = this._scene[ELYSIA_INTERNAL].callLoad();

		await this._sceneLoadPromise;

		this.renderer?.onSceneLoaded(this.scene);
		this.renderer?.onResize(this._canvasObserver.width, this._canvasObserver.height);

		this.scene[ELYSIA_INTERNAL].root[ELYSIA_INTERNAL].parent = this.scene[ELYSIA_INTERNAL].root;
		this.scene[ELYSIA_INTERNAL].root[ELYSIA_INTERNAL].state = ObjectState.Active;

		startActor(this.scene[ELYSIA_INTERNAL].root);

		if(this.autoUpdate) {
			this.update();
		}
	};

	update = () => {
		ELYSIA_DEV: {
			try {
				this._update();
			} catch(e) {
				elysiaLogger.error(e);
				this._hasErrored = true;
			}
			if(this.autoUpdate && !this._hasErrored)
				requestAnimationFrame(this.update);
		}

		ELYSIA_PROD: {
			if(this.autoUpdate)
				requestAnimationFrame(this.update);
			this._update();
		}
	};

	protected static _instance: Application;
	protected _canvas: HTMLCanvasElement;
	protected _canvasObserver: CanvasObserver;
	protected _hasErrored = false;
	protected _sizeHasChanged = false;
	protected _clock = new Clock;
	protected _paused = false;
	protected _scene?: Scene;
	protected _sceneLoadPromise?: Promise<void>

	protected _update = () => {
		this._clock.capture();

		if(this._paused) return;

		if(this._sizeHasChanged) {
			this.renderer?.onResize(this._canvasObserver.width, this._canvasObserver.height);
		}

		let root = this.scene[ELYSIA_INTERNAL].root;

		preUpdateActor(root, this._clock.delta, this._clock.elapsed, this._sizeHasChanged);

		mainUpdateActor(root, this._clock.delta, this._clock.elapsed);

		// update renderer
		this.renderer?.onRender(this._clock.delta, this._clock.elapsed);

		postUpdateActor(root, this._clock.delta, this._clock.elapsed);

		this._sizeHasChanged = false;
	}
}
