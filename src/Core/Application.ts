// @ts-types="npm:@types/three@^0.169"
import * as Three from "three";
import type { LogLevel } from "../Logging/Levels.ts";
import { ASSERT, isBrowser, isDestroyable } from "../Shared/Asserts.ts";
import { EventQueue } from "../Events/EventQueue.ts";
import { InputQueue } from "../Input/InputQueue.ts";
import { AssetLoader } from "../Assets/AssetLoader.ts";
import { Profiler } from "./Profiler.ts";
import { AudioPlayer } from "../Audio/AudioPlayer.ts";
import { MouseObserver } from "../Input/Mouse.ts";
import type { Scene } from "./Scene.ts";
import type { RenderPipeline } from "../Rendering/RenderPipeline.ts";
import { BasicRenderPipeline } from "../Rendering/BasicRenderPipeline.ts";
import { ELYSIA_LOGGER, SET_ELYSIA_LOGLEVEL } from "../Shared/Logger.ts";
import { ResizeController, ResizeEvent } from "../Shared/Resize.ts";
import { defaultScheduler } from "../UI/Scheduler.ts";
import { ElysiaStats } from "../UI/ElysiaStats.ts";
import {
	s_App,
	s_OnBeforePhysicsUpdate,
	s_OnCreate,
	s_OnEnable,
	s_OnEnterScene,
	s_OnLoad,
	s_OnResize,
	s_OnUpdate,
	s_SceneLoadPromise,
	s_SceneRoot,
} from "../Internal/mod.ts";
import { GameClock } from "./GameClock.ts";
import { installMaterialAddonsToPrototypes } from "../WebGL/InstallMaterialAddons.ts";

// Install material addons to Three.Material prototypes
installMaterialAddonsToPrototypes([
	Three.MeshBasicMaterial,
	Three.MeshStandardMaterial,
	Three.MeshPhysicalMaterial,
	Three.MeshPhongMaterial,
	Three.MeshToonMaterial,
	Three.MeshLambertMaterial,
	Three.ShaderMaterial,
]);

export interface ApplicationConstructorArguments {
	/**
	 * The canvas element to render to. If not provided, a new full screen canvas will be created and appended to the document body.
	 */
	output?: HTMLCanvasElement;

	/**
	 * The log level for the application.
	 * @default LogLevel.Production
	 */
	logLevel?: LogLevel;

	/**
	 * The event queue for the application. A default instance will be created if not provided.
	 */
	eventQueue?: EventQueue;

	/**
	 * An optional profiler instance for the application.
	 */
	profiler?: Profiler;

	/**
	 * The asset loader instance for the application. A default instance will be created if not provided.
	 */
	assets?: AssetLoader<any>;

	/**
	 * The audio player instance for the application. A default instance will be created if not provided.
	 */
	audio?: AudioPlayer;

	/**
	 * The render pipeline for the application. A default Basic Render Pipeline instance will be created if not provided.
	 */
	renderPipeline?: RenderPipeline;

	/**
	 * If the application should display stats.
	 */
	stats?: boolean;

	/**
	 * If the application should manage the default UI scheduler in it's event loop.
	 */
	updateDefaultUiScheduler?: boolean;

	/**
	 * If the application should defer calling `Application.update()` to the user.
	 */
	manualUpdate?: boolean;
}

export class Application {
	/**
	 * If this App should call Elysia UIs `defaultScheduler.update()` in it's update loop.
	 * @default true
	 */
	public updateDefaultUiScheduler?: boolean;

	/**
	 * The maximum number of consecutive errors that can occur inside update() before stopping.
	 * If manualUpdate is enabled this will have no effect.
	 */
	public maxErrorCount = 10;

	/**
	 * If the application should not schedule updates automatically.
	 * If true, you must call `Application.update()` manually.
	 */
	public manualUpdate?: boolean;

	/**
	 * If the application is paused.
	 * If true, the application will not update or render, but will still process input and events.
	 */
	public paused = false;

	/**
	 * If the application should pause when the window loses focus.
	 */
	public pauseOnBlur = false;

	/**
	 * The render pipeline.
	 */
	public get renderPipeline(): RenderPipeline {
		return this.#renderPipeline!;
	}

	/**
	 * The active Scene.
	 */
	public get scene(): Scene | undefined {
		return this.#scene;
	}

	/** The Application's AssetLoader instance */
	public get assets(): AssetLoader<any> {
		return this.#assets;
	}

	/**
	 * The application instance's event queue.
	 */
	public readonly events!: EventQueue;

	/**
	 * The application instance's mouse observer.
	 * The position of the mouse and is updated at the start of each frame.
	 */
	public readonly mouse!: MouseObserver;

	/**
	 * The input queue for this application.
	 */
	public readonly input: InputQueue = new InputQueue();

	/**
	 * Application profiler instance.
	 */
	public readonly profiler!: Profiler;

	/**
	 * Applications audio player instance.
	 */
	public readonly audio!: AudioPlayer;

	constructor(config: ApplicationConstructorArguments = {}) {
		if (!isBrowser()) return;

		this.loadScene = this.loadScene.bind(this);
		this.destructor = this.destructor.bind(this);
		this.update = this.update.bind(this);

		// @ts-ignore - global
		if (config.logLevel) {
			SET_ELYSIA_LOGLEVEL(config.logLevel);
		}

		ELYSIA_LOGGER.debug("Creating application instance", config);

		this.manualUpdate = config.manualUpdate ?? false;
		this.events = config.eventQueue ?? new EventQueue();
		this.profiler = config.profiler ?? new Profiler();
		this.audio = config.audio ?? new AudioPlayer();
		this.#assets = config.assets ?? new AssetLoader({});
		this.#renderPipeline = config.renderPipeline ?? new BasicRenderPipeline();
		this.#stats = config.stats ?? false;
		this.#output = config.output ?? document.createElement("canvas");

		if (!config.output) {
			ELYSIA_LOGGER.debug(
				"No output canvas element provided, creating a new fullscreen one.",
			);
			document.body.appendChild(this.#output);
			this.#output.style.width = "100%";
			this.#output.style.height = "100vh";
			this.#output.style.display = "block";
			this.#output.style.position = "relative";
			this.#output.style.margin = "0";
			this.#output.style.padding = "0";
		}

		// if config.output is undefined, we want the canvas sized to the window
		this.#resizeController = new ResizeController(config.output);

		this.#resizeController.addEventListener(
			ResizeEvent,
			() => (this.#sizeHasChanged = true),
		);

		this.mouse = new MouseObserver(this.#output);

		this.updateDefaultUiScheduler = config.updateDefaultUiScheduler ?? true;

		if (config.stats) {
			this.#stats = document.createElement("elysia-stats") as ElysiaStats;
			this.#output.parentElement?.appendChild(this.#stats);
		}

		globalThis.addEventListener(
			"blur",
			() => this.pauseOnBlur && (this.paused = true),
		);
		globalThis.addEventListener(
			"focus",
			() => this.pauseOnBlur && (this.paused = false),
		);
	}

	/**
	 * Checks if the current browser supports WebGL2.
	 */
	public isWebGl2Supported(): boolean {
		if (!isBrowser()) {
			ELYSIA_LOGGER.warn(
				"isWebGl2Supported() is only available in the browser.",
			);
			return false;
		}

		let canvas: HTMLCanvasElement | undefined;
		try {
			canvas = document.createElement("canvas");
			return !!(
				globalThis.WebGL2RenderingContext && canvas.getContext("webgl2")
			);
		} catch {
			return false;
		} finally {
			canvas?.remove();
		}
	}

	/**
	 * Load a Scene into the application. This will unload the previous Scene.
	 * @param scene
	 */
	public async loadScene(scene: Scene) {
		if (!isBrowser()) {
			ELYSIA_LOGGER.warn("loadScene() is only available in the browser.");
			return;
		}

		ASSERT(this.renderPipeline && this.#output && scene);

		try {
			this.#rendering = false;

			if (this.#scene) {
				ELYSIA_LOGGER.debug("Unloading previous Scene", this.#scene);
				// need to finish loading the scene before we can unload it to prevent race conditions
				await this.#scene[s_SceneLoadPromise];
				this.#scene.destructor?.();
				this.#clock = new GameClock();
			}

			await this.#assets?.load();

			scene[s_App] = this;
			this.#scene = scene;
			await this.#scene[s_OnLoad]();

			this.#renderPipeline![s_OnCreate](this.#scene, this.#output);
			this.#renderPipeline!.onResize(
				this.#resizeController.width,
				this.#resizeController.height,
			);

			this.#scene[s_OnCreate]();
			this.#scene[s_SceneRoot][s_OnEnterScene]();
			this.#scene[s_SceneRoot][s_OnEnable]();

			ELYSIA_LOGGER.info("Scene started", scene);

			this.#sizeHasChanged = false;

			this.#rendering = true;

			if (!this.manualUpdate) this.update();
		} catch (e) {
			ELYSIA_LOGGER.error(e);
			return;
		}
	}

	/** The main update loop for the application. */
	public update(): void | boolean {
		if (!isBrowser()) {
			ELYSIA_LOGGER.warn("update() is only available in the browser.");
			return false;
		}

		try {
			if (!this.#scene || !this.#rendering) {
				ELYSIA_LOGGER.debug(
					"Scene or rendering is not ready, skipping update loop.",
				);
				return;
			}

			if (this.#errorCount <= this.maxErrorCount) {
				!this.manualUpdate && requestAnimationFrame(this.update);
			} else {
				ELYSIA_LOGGER.critical(
					"Too many consecutive errors, stopping update loop.",
				);
				return;
			}

			this.#clock.capture();

			// dispatchQueue input and event queue callbacks
			this.input.flush();
			this.events.dispatchQueue();

			// update stats
			if (this.#stats instanceof ElysiaStats) {
				this.renderPipeline!.getRenderer().info.autoReset = false;
				this.#stats.stats.fps = Math.round(1 / this.#clock.delta);
				this.#stats.stats.calls =
					this.renderPipeline!.getRenderer().info.render.calls;
				this.#stats.stats.lines =
					this.renderPipeline!.getRenderer().info.render.lines;
				this.#stats.stats.points =
					this.renderPipeline!.getRenderer().info.render.points;
				this.#stats.stats.triangles =
					this.renderPipeline!.getRenderer().info.render.triangles;
				this.#stats.stats.memory =
					this.renderPipeline!.getRenderer().info.memory.geometries +
					this.renderPipeline!.getRenderer().info.memory.textures;
				this.#renderPipeline!.getRenderer().info.reset();
			}

			if (this.#sizeHasChanged) {
				this.#scene[s_SceneRoot][s_OnResize](
					this.#resizeController.width,
					this.#resizeController.height,
				);
				this.#renderPipeline!.onResize(
					this.#resizeController.width,
					this.#resizeController.height,
				);
				this.#sizeHasChanged = false;
			}

			if (!this.paused) {
				// Scene physics update
				this.#scene[s_OnBeforePhysicsUpdate](
					this.#clock.delta,
					this.#clock.elapsed,
				);
				// Scene update
				this.#scene[s_OnUpdate](this.#clock.delta, this.#clock.elapsed);
				// Scene render
				this.#renderPipeline?.onRender(
					this.#scene,
					this.#scene.getActiveCamera(),
				);
			}

			// update default UI scheduler
			this.updateDefaultUiScheduler && defaultScheduler.update();

			// clear input and event queues
			this.input.clear();
			this.events.clear();

			this.#errorCount = 0;
		} catch (e) {
			ELYSIA_LOGGER.error(e);
			this.#errorCount++;
		}
	}

	/** Destroy the application and all of its resources. */
	public destructor(): void {
		if (!isBrowser()) {
			ELYSIA_LOGGER.warn("destructor() is only available in the browser.");
			return;
		}

		ELYSIA_LOGGER.debug("Destroying application");

		this.#rendering = false;

		for (const prop of Object.values(this))
			if (isDestroyable(prop)) prop.destructor();

		if (this.#stats instanceof ElysiaStats) this.#stats.remove();
		this.#scene?.destructor();
		this.#renderPipeline?.destructor();
		this.#output.remove();
	}

	#resizeController!: ResizeController;
	#sizeHasChanged = false;
	#errorCount = 0;
	#clock = new GameClock();
	#scene?: Scene;
	#rendering = false;
	readonly #assets!: AssetLoader<any>;
	readonly #stats: boolean | ElysiaStats = false;
	readonly #renderPipeline?: RenderPipeline;
	readonly #output!: HTMLCanvasElement;
}
