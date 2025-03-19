import type { IRenderer } from "../renderer/mod.ts";
import { Input } from "../input/mod.ts";
import type { Scene } from "./scene.ts";
import { CanvasObserver } from "../util/canvas.ts";
import { Clock } from "./clock.ts";
import type { Constructor } from "../util/types.ts";
import { EventQueue } from "../events/queue.ts";
import { EventDispatcher } from "../events/dispatcher.ts";
import { createEvent } from "../events/mod.ts";

interface ApplicationArgs {
	/** A renderer that satisfies the Renderer interface */
	renderer: IRenderer;
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

export const EBeforeUpdate = createEvent<void>("elysiatech:Application:beforeUpdate");
export const EUpdate = createEvent<void>("elysiatech:Application:update");
export const EAfterUpdate = createEvent<void>("elysiatech:Application:afterUpdate");
export const EBeforeRender = createEvent<void>("elysiatech:Application:beforeRender");
export const EAfterRender = createEvent<void>("elysiatech:Application:afterRender");
export const ECanvasResize = createEvent<{ x: number, y: number }>("elysiatech:Application:canvasResize");
export const ESceneLoaded = createEvent<void>("elysiatech:Application:sceneLoaded");
export const ESceneStarted = createEvent<void>("elysiatech:Application:sceneStarted");
export const ESceneLoadError = createEvent<void>("elysiatech:Application:sceneLoadError");

export class Application {

	static get instance() {
		ELYSIA_DEV: if (!Application._instance) {
			throw Error(
				"Attempted to access Application instance before it was initialized."
			);
		}
		return Application._instance;
	}

	static get scene() {
		return Application._instance.scene;
	}

	static get renderer() {
		return Application.instance._renderer;
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

	autoUpdate: boolean;

	get scene() {
		return this._scene;
	}

	get renderer() {
		return this._renderer;
	}

	get canvas() {
		return this._canvasObserver;
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

	get clock() {
		return this._clock;
	}

	get hasErrored() {
		return this._hasErrored;
	}

	get sizeHasChanged() {
		return this._sizeHasChanged;
	}

	get started() {
		return this._started;
	}

	get beforeUpdateQueue() {
		return this._beforeUpdateQueue;
	}

	get updateQueue() {
		return this._updateQueue;
	}

	get afterUpdateQueue() {
		return this._afterUpdateQueue;
	}

	get beforeRenderQueue() {
		return this._beforeRenderQueue;
	}

	get afterRenderQueue() {
		return this._afterRenderQueue;
	}

	constructor(args: ApplicationArgs) {
		if(Application._instance) {
			elysiaLogger.error("An instance of Application already exists.");
			throw Error("An instance of Application already exists.");
		}

		Application._instance = this;

		this._renderer = args.renderer;
		this._canvas = args.canvas;
		this.autoUpdate = args.autoUpdate ?? false;

		this._canvasObserver = new CanvasObserver("mainCanvas", this._canvas);
		this._canvasObserver.onResize(() => {
			if(this._started) {
				this._eventDispatcher.dispatchEvent(ECanvasResize, {
					x: this._canvasObserver.width,
					y: this._canvasObserver.height
				})
				this._sizeHasChanged = true;
			}
		});

		ELYSIA_DEV: elysiaLogger.success("Application initialized.");
	}

	destructor() {
		for (let d of [this._renderer]) {
			try {
				d.destructor();
			} catch (e) {
				elysiaLogger.error(e);
			}
		}
	}

	loadScene = async (scene: Constructor<Scene>) => {
		try {
			if(this._scene) {
				await this._sceneLoadPromise;
				this._scene.destructor();
			}

			await this._canvasObserver.sync();

			// auto initializes value
			new scene();

			this._sceneLoadPromise = this._scene[ELYSIA_INTERNAL].callLoad();

			await this._sceneLoadPromise;

			await this._canvasObserver.sync();

			this._renderer?.onSceneLoaded(this.scene);

			this._eventDispatcher.dispatchEvent(ESceneLoaded, undefined);

			for(let a of this.scene[ELYSIA_INTERNAL].actors) {
				startActor(a);
			}

			this._started = true;
			this._eventDispatcher.dispatchEvent(ESceneStarted, undefined);

			if(this.autoUpdate) {
				this.update();
			}
		} catch (e) {
			elysiaLogger.error(e);
			this._eventDispatcher.dispatchEvent(ESceneLoadError, undefined);
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
			if(this.autoUpdate && !this._hasErrored) {
				requestAnimationFrame(this.update);
			}
		}

		ELYSIA_PROD: {
			if (this.autoUpdate) {
				requestAnimationFrame(this.update);
			}
			this._update();
		}
	};

	protected static _instance: Application;

	[ELYSIA_INTERNAL] = {
		set scene(scene: Scene) {
			Application._instance._scene = scene;
		}
	}

	protected _renderer: IRenderer;
	protected _canvas: HTMLCanvasElement;
	protected _canvasObserver: CanvasObserver;
	protected _hasErrored = false;
	protected _sizeHasChanged = false;
	protected _clock = new Clock;
	protected _paused = false;
	protected _scene?: Scene;
	protected _sceneLoadPromise?: Promise<void>
	protected _started = false;
	protected _beforeUpdateQueue = new EventQueue;
	protected _updateQueue = new EventQueue;
	protected _afterUpdateQueue = new EventQueue;
	protected _beforeRenderQueue = new EventQueue;
	protected _afterRenderQueue = new EventQueue;
	protected _eventDispatcher = new EventDispatcher;

	protected _update = () => {
		this._clock.capture();

		if(this._paused) return;

		// update renderer with new size
		if(this._sizeHasChanged) {
			this._renderer?.onCanvasResize?.(this._canvasObserver.width, this._canvasObserver.height);
		}

		this._beforeUpdateQueue.dispatchQueue();
		this._eventDispatcher.dispatchEvent(EBeforeUpdate, undefined);

		for(let a of this._scene![ELYSIA_INTERNAL].actors) {
			preUpdateActor(
				a,
				this._clock.delta,
				this._clock.elapsed,
				this._sizeHasChanged,
				this._canvasObserver.width,
				this._canvasObserver.height
			);
		}

		this._updateQueue.dispatchQueue();
		this._eventDispatcher.dispatchEvent(EUpdate, undefined);

		for(let a of this._scene![ELYSIA_INTERNAL].actors) {
			mainUpdateActor(a, this._clock.delta, this._clock.elapsed);
		}

		this._beforeRenderQueue.dispatchQueue();
		this._eventDispatcher.dispatchEvent(EBeforeRender, undefined);

		this._renderer?.onRender(this._clock.delta, this._clock.elapsed);

		this._afterRenderQueue.dispatchQueue();
		this._eventDispatcher.dispatchEvent(EAfterRender, undefined);

		for(let a of this._scene![ELYSIA_INTERNAL].actors) {
			postUpdateActor(a, this._clock.delta, this._clock.elapsed);
		}

		this._afterUpdateQueue.dispatchQueue();
		this._eventDispatcher.dispatchEvent(EAfterUpdate, undefined);

		[	this._beforeUpdateQueue,
			this._updateQueue,
			this._afterUpdateQueue,
			this._beforeRenderQueue,
			this._afterRenderQueue
		].forEach(q => q.clear());
	}
}
