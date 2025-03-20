import type { IRenderer } from "../renderer/mod.ts";
import { Input } from "../input/mod.ts";
import type { ISceneInternals, Scene } from "./scene.ts";
import { CanvasObserver } from "../util/canvas.ts";
import { Clock } from "./clock.ts";
import { EventQueue } from "../events/queue.ts";
import { EventDispatcher } from "../events/dispatcher.ts";
import { throwDevException } from "../util/exceptions.ts";
import { elysiaLogger } from "./log.ts";
import { Destructible } from "../util/destructible.ts";
import { makeNew } from "./new.ts";
import type { IActorInternals } from "./actor.ts";
import {
	EAfterRender,
	EAfterUpdate,
	EBeforeRender,
	EBeforeUpdate,
	ECanvasResize,
	ESceneLoaded,
	ESceneLoadError,
	ESceneStarted,
	EUpdate,
} from "./events.ts";

interface ApplicationArgs {
	/** A renderer that satisfies the Renderer interface */
	renderer: IRenderer;
	/** The canvas element to render to. */
	canvas?: HTMLCanvasElement;
	/**
	 *  If the application should automatically update.
	 *  This is useful if you don't have any other logic running
	 *  per-frame and want to let Elysia handle the update loop.
	 *  @default false
	 */
	autoUpdate?: boolean;
}

export class Application {
	static get instance() {
		ELYSIA_DEV: if (!Application._instance) {
			throwDevException(
				"Application instance does not exist. Make sure to create an instance of Application before accessing it.",
			);
		}
		return Application._instance;
	}

	static get scene() {
		return Application.instance._scene;
	}

	static get renderer() {
		return Application.instance._renderer;
	}

	static startMainThread = (args: {
		canvas: HTMLCanvasElement | string;
		workers: Worker[];
	}): Function => {
		let canvasObserver = makeNew(
			CanvasObserver,
			"mainCanvas",
			typeof args.canvas === "string"
				? (document.getElementById(args.canvas) as HTMLCanvasElement)
				: args.canvas,
		);

		args.workers.forEach((w) => {
			canvasObserver.addWorker(w)
			Input.addWorker(w)
			// Audio.addWorker(w)
		});

		return () => {
			canvasObserver.destructor();
		};
	};

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

	get clock() {
		return this._clock;
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
		if (Application._instance) {
			elysiaLogger.error("An instance of Application already exists.");
			throw Error("An instance of Application already exists.");
		}

		Application._instance = this;

		this._renderer = args.renderer;
		this._canvas = args.canvas;
		this.autoUpdate = args.autoUpdate ?? false;

		this._canvasObserver = makeNew(CanvasObserver, "mainCanvas", this._canvas);
		this._canvasObserver.onResize(() => {
			if (this._started) {
				this._eventDispatcher.dispatchEvent(ECanvasResize, {
					x: this._canvasObserver.width,
					y: this._canvasObserver.height,
				});
				this._sizeHasChanged = true;
			}
		});

		ELYSIA_DEV: elysiaLogger.success("Application initialized.");
	}

	destructor() {}

	loadScene = async (scene: typeof Scene) => {
		try {
			if (this._scene) {
				Destructible.destroy(this._scene);
			}

			await this._canvasObserver.sync();

			makeNew(scene); // implicitly sets Application._scene

			this._renderer?.onSceneLoaded(this.scene);

			this._eventDispatcher.dispatchEvent(ESceneLoaded, undefined);

			this._started = true;

			(<ISceneInternals>(<unknown>this._scene))._callStart();

			this._eventDispatcher.dispatchEvent(ESceneStarted, undefined);

			if (this.autoUpdate) {
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
			} catch (e) {
				elysiaLogger.error(e);
				this._hasErrored = true;
			}
			if (this.autoUpdate && !this._hasErrored) {
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

	private static _instance: Application;
	private readonly _renderer: IRenderer;
	private readonly _canvas: HTMLCanvasElement;
	private readonly _canvasObserver: CanvasObserver;
	private _hasErrored = false;
	private _sizeHasChanged = false;
	private _clock = new Clock();
	private _paused = false;
	private _scene?: Scene;
	private _started = false;
	private _beforeUpdateQueue = makeNew(EventQueue);
	private _updateQueue = makeNew(EventQueue);
	private _afterUpdateQueue = makeNew(EventQueue);
	private _beforeRenderQueue = makeNew(EventQueue);
	private _afterRenderQueue = makeNew(EventQueue);
	private _eventDispatcher = EventDispatcher;

	private _update = (userDelta?: number, userElapsed?: number) => {
		this._clock.capture();

		if (this._paused) return;

		let actors = (<ISceneInternals>(<unknown>this._scene))._children;

		let time = Object.freeze({
			delta: userDelta ?? this._clock.delta,
			elapsed: userElapsed ?? this._clock.elapsed,
		});

		// call canvas resize events
		if (this._sizeHasChanged) {
			let x = this._canvasObserver.width;
			let y = this._canvasObserver.height;

			this._renderer?.onCanvasResize?.(x, y);

			for (let a of actors) {
				(<IActorInternals>(<unknown>a))._callCanvasResize(x, y);
			}

			this._eventDispatcher.dispatchEvent(ECanvasResize, { x, y });

			this._sizeHasChanged = false;
		}

		// @ts-expect-error
		(<ISceneInternals><unknown>this._scene).onUpdate?.(time.delta, time.elapsed);

		this._beforeUpdateQueue.dispatchQueue();
		this._eventDispatcher.dispatchEvent(EBeforeUpdate, time);

		for (let a of actors) {
			(<IActorInternals>(<unknown>a))._callBeforeUpdate(
				time.delta,
				time.elapsed,
			);
		}

		this._updateQueue.dispatchQueue();
		this._eventDispatcher.dispatchEvent(EUpdate, time);

		for (let a of actors) {
			(<IActorInternals>(<unknown>a))._callUpdate(time.delta, time.elapsed);
		}

		this._beforeRenderQueue.dispatchQueue();
		this._eventDispatcher.dispatchEvent(EBeforeRender, time);

		this._renderer?.onRender(time.delta, time.elapsed);

		this._afterRenderQueue.dispatchQueue();
		this._eventDispatcher.dispatchEvent(EAfterRender, time);

		for (let a of actors) {
			(<IActorInternals>(<unknown>a))._callAfterUpdate(
				time.delta,
				time.elapsed,
			);
		}

		this._afterUpdateQueue.dispatchQueue();
		this._eventDispatcher.dispatchEvent(EAfterUpdate, time);

		for (let q of [
			this._beforeUpdateQueue,
			this._updateQueue,
			this._afterUpdateQueue,
			this._beforeRenderQueue,
			this._afterRenderQueue,
		]) {
			q.clear();
		}
	};
}

export interface IApplicationInternals {
	_scene?: Scene;
	_renderer: IRenderer;
	_canvasObserver: CanvasObserver;
	_clock: Clock;
}