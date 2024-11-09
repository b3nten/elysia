import { Destroyable, RenderPipelineLifecycle } from "../Core/Lifecycle.ts";
import { Scene } from "../Scene/Scene.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';
import { ElysiaEventDispatcher } from "../Events/EventDispatcher.ts";
import { ResizeEvent } from "../Core/Resize.ts";
import { ELYSIA_LOGGER } from "../Core/Logger.ts";
import { bound } from "../Core/Utilities.ts";

/**
 * Abstract base RenderPipeline class used to implement custom render pipelines.
 */
export abstract class RenderPipeline implements RenderPipelineLifecycle, Destroyable {

	/**
	 * Called when the pipeline is created for a given scene.
	 * It may be called multiple times if the scene is changed.
	 */
	abstract onCreate(scene: Scene, output: HTMLCanvasElement): void

	/**
	 * Called when the active camera is changed.
	 */
	onCameraChange(camera: Three.Camera) { }

	/**
	 * Retrieves the renderer used by the pipeline.
	 */
	abstract getRenderer(): Three.WebGLRenderer;

	/**
	 * Called when the canvas is resized.
	 */
	onResize(width: number, height: number) {}

	/**
	 * Called every frame to render the scene.
	 */
	abstract onRender(scene: Scene, camera: Three.Camera): void;

	destructor() {}
}
