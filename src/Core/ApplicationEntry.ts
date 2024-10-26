import { LogLevel } from "../Logging/Levels.ts";
import { ASSERT, isDestroyable, isDev } from "./Asserts.ts";
import { MouseIntersections } from "../Input/MouseIntersections.ts";
import { ElysiaEventQueue } from "../Events/EventQueue.ts";
import { InputQueue } from "../Input/InputQueue.ts";
import { AssetLoader } from "../Assets/AssetLoader.ts";
import { Profiler } from "./Profiler.ts";
import { AudioPlayer } from "../Audio/AudioPlayer.ts";
import { MouseObserver } from "../Input/Mouse.ts";
import { Root, type Scene } from "../Scene/Scene.ts";
import type { RenderPipeline } from "../RPipeline/RenderPipeline.ts";
import { BasicRenderPipeline } from "../RPipeline/BasicRenderPipeline.ts";
import { ELYSIA_LOGGER } from "./Logger.ts";
import { ResizeController, ResizeEvent } from "./Resize.ts";
import { defaultScheduler } from "../UI/Scheduler.ts";
import { ElysiaStats } from "../UI/ElysiaStats.ts";
import {
	s_App, s_OnBeforePhysicsUpdate,
	s_OnCreate,
	s_OnEnable,
	s_OnEnterScene,
	s_OnLoad,
	s_OnResize,
	s_OnUpdate,
	s_SceneLoadPromise
} from "../Scene/Internal.ts";
import { bound } from "./Utilities.ts";
import { GameClock } from "./GameClock.ts";


interface ApplicationConstructorArguments
{
	output?: HTMLCanvasElement,
	logLevel?: LogLevel,
	eventQueue?: ElysiaEventQueue,
	profiler?: Profiler,
	assets?: AssetLoader<any>,
	audio?: AudioPlayer
	renderPipeline?: RenderPipeline
	stats?: boolean
	updateDefaultUiScheduler?: boolean
	manualUpdate?: boolean
}

export class Application {

	/**
	 * The application instance's event queue.
	 */
	public readonly events: ElysiaEventQueue;

	/**
	 * The application instance's mouse observer.
	 * The position of the mouse and intersecting objects are updated at the start of each frame.
	 */
	public readonly mouse: MouseObserver;

	/**
	 * The input queue for this application.
	 */
	public readonly input: InputQueue = new InputQueue;

	/**
	 * Application profiler instance.
	 */
	public readonly profiler: Profiler;

	/**
	 * Applications audio player instance.
	 */
	public readonly audio: AudioPlayer;

	/**
	 * If this s_App should call Elysia UIs `defaultScheduler.update()` in it's update loop.
	 * @default true
	 */
	public updateDefaultUiScheduler: boolean;

	/**
	 * The maximum number of consecutive errors that can occur inside update() before stopping.
	 * If manualUpdate is enabled this will have no effect.
	 */
	public maxErrorCount = 10;

	/**
	 * If the application should not schedule updates automatically.
	 * If true, you must call Application.update() manually.
	*/
	public manualUpdate: boolean;

	/**
	 * The active render pipeline.
	 */
	public get renderPipeline(): RenderPipeline { return this.#renderPipeline!; }

	/**
	 * The active s_Scene.
	*/
	public get scene(): Scene | undefined { return this.#scene; }

	/** The Application's AssetLoader instance */
	get assets(): AssetLoader<any> { return this.#assets; }

	constructor(config: ApplicationConstructorArguments = {})
	{
		this.loadScene = this.loadScene.bind(this)
		this.destructor = this.destructor.bind(this)
		this.update = this.update.bind(this)

		// @ts-ignore - global
		globalThis.SET_ELYSIA_LOGLEVEL(config.logLevel ?? isDev() ? LogLevel.Debug : LogLevel.Production)

		this.manualUpdate = config.manualUpdate ?? false;
		this.events = config.eventQueue ?? new ElysiaEventQueue
		this.profiler = config.profiler ?? new Profiler
		this.audio = config.audio ?? new AudioPlayer
		this.#assets = config.assets ?? new AssetLoader({});
		this.#renderPipeline = config.renderPipeline ?? new BasicRenderPipeline;
		this.#stats = config.stats ?? false;
		this.#output = config.output ?? document.createElement("canvas");

		if(!config.output)
		{
			ELYSIA_LOGGER.debug("No output canvas element provided, creating a new fullscreen one.")
			document.body.appendChild(this.#output)
			this.#output.style.width = "100%";
			this.#output.style.height = "100vh";
			this.#output.style.display = "block";
			this.#output.style.position = "relative";
			this.#output.style.margin = "0";
			this.#output.style.padding = "0";
		}

		// if config.output is undefined, we want the canvas sized to the window
		this.#resizeController = new ResizeController(config.output);

		this.#resizeController.addEventListener(ResizeEvent, () => this.#sizeHasChanged = true);

		this.mouse = new MouseObserver(this.#output);

		this.updateDefaultUiScheduler = config.updateDefaultUiScheduler ?? true;

		if(config.stats)
		{
			this.#stats = document.createElement("elysia-stats") as ElysiaStats;
			this.#output.parentElement?.appendChild(this.#stats);
		}
	}

	/**
	 * Load a s_Scene into the application. This will unload the previous s_Scene.
	 * @param scene
	 */
	@bound public async loadScene(scene: Scene)
	{
		ASSERT(
			this.renderPipeline &&
			this.#output &&
			scene,
		)

		try
		{
			this.#rendering = false;

			if(this.#scene)
			{
				ELYSIA_LOGGER.debug("Unloading previous s_Scene", this.#scene)
				await this.#scene[s_SceneLoadPromise];
				this.#scene.destructor?.();
				this.#clock = new GameClock;
			}

			await this.#assets?.load();

			scene[s_App] = this;
			this.#scene = scene
			await this.#scene[s_OnLoad]();

			ELYSIA_LOGGER.debug("Scene loaded", scene)

			this.#renderPipeline!.onCreate(this.#scene, this.#output);
			this.#renderPipeline!.onResize(this.#resizeController.width, this.#resizeController.height);

			this.#scene[s_OnCreate]();
			this.#scene[Root][s_OnEnterScene]();
			this.#scene[Root][s_OnEnable]();

			ELYSIA_LOGGER.debug("Scene started", scene)

			this.#sizeHasChanged = false;

			this.#rendering = true;

			if(!this.manualUpdate) this.update();
		}
		catch(e)
		{
			ELYSIA_LOGGER.error(e)
			return;
		}
	}

	/** Destroy the application and all of it's resources. */
	@bound public destructor()
	{
		ELYSIA_LOGGER.debug("Destroying application")
		this.#rendering = false;

		for(const prop of Object.values(this)) if(isDestroyable(prop)) prop.destructor();

		this.#scene?.destructor();
		this.#renderPipeline?.destructor();
		this.#output.remove();
	}

	/** The main update loop for the application. */
	@bound public update()
	{
		try {
			if(!this.#scene || !this.#rendering) throw Error("No s_Scene loaded")

			if(this.#errorCount <= this.maxErrorCount)
			{
				!this.manualUpdate && requestAnimationFrame(this.update);
			}
			else
			{
				ELYSIA_LOGGER.critical("Too many consecutive errors, stopping update loop.")
				return;
			}

			this.#clock.capture();

			// update mouse intersection
			this.#mouseIntersectionController.cast(
				this.#scene.getActiveCamera(),
				this.#scene.object3d,
				this.mouse.x / this.#output.clientWidth * 2 -1,
				this.mouse.y / this.#output.clientHeight * 2 -1
			);

			// flush input and event queue callbacks
			this.input.flush();
			this.events.flush();

			// update stats
			if(this.#stats instanceof ElysiaStats)
			{
				this.renderPipeline!.getRenderer().info.autoReset = false;
				this.#stats.stats.fps = Math.round(1 / this.#clock.delta);
				this.#stats.stats.calls = this.renderPipeline!.getRenderer().info.render.calls;
				this.#stats.stats.lines = this.renderPipeline!.getRenderer().info.render.lines;
				this.#stats.stats.points = this.renderPipeline!.getRenderer().info.render.points;
				this.#stats.stats.triangles = this.renderPipeline!.getRenderer().info.render.triangles;
				this.#stats.stats.memory = this.renderPipeline!.getRenderer().info.memory.geometries + this.renderPipeline!.getRenderer().info.memory.textures;
				this.#renderPipeline!.getRenderer().info.reset();
			}

			if(this.#sizeHasChanged)
			{
				this.#scene[Root][s_OnResize](this.#resizeController.width, this.#resizeController.height);
				this.#renderPipeline!.onResize(this.#resizeController.width, this.#resizeController.height);
				this.#sizeHasChanged = false;
			}

			this.#scene[s_OnBeforePhysicsUpdate](this.#clock.delta, this.#clock.elapsed);

			// s_Scene update
			this.#scene[s_OnUpdate](this.#clock.delta, this.#clock.elapsed);

			// s_Scene render
			this.#renderPipeline?.onRender(this.#scene, this.#scene.getActiveCamera());

			// update default UI scheduler
			this.updateDefaultUiScheduler && defaultScheduler.update();

			// clear input and event queues
			this.input.clear();
			this.events.clear();

			this.#errorCount = 0;
		}
		catch(e)
		{
			ELYSIA_LOGGER.error(e)
			this.#errorCount++;
		}
	}

	#resizeController: ResizeController;
	#sizeHasChanged = false;
	#assets: AssetLoader<any>;
	#mouseIntersectionController = new MouseIntersections;
	#errorCount = 0;
	#stats: boolean | ElysiaStats = false;
	#clock = new GameClock;
	#renderPipeline?: RenderPipeline;
	#output: HTMLCanvasElement;
	#scene?: Scene;
	#rendering = false;
}
