import { uuid } from "../Shared/Utilities.ts";
import type { Scene } from "./Scene.ts";
import type * as Three from "three";

/**
 * An interface for objects with a destructor method.
 */
export interface IDestroyable
{
	destructor(): void;
}

export class ComponentLifecycle
{
	public uuid: string = uuid()
	/**
	 * Called once when the actor is created.
	 * This is the first method called in the actor's lifecycle and will only be called once.
	 * The actor's s_App, Scene, and Parent reference will be defined by the time this is called.
	 */
	protected onCreate(): void {}

	/**
	 * Called when the actor is enabled. This occurs when the actor is added to the s_Scene
	 * and when the actor is enabled after being disabled. This may be called multiple times.
	 */
	protected onEnable(): void {}

	/**
	 * Called before onUpdate() when the actor is started. This will only be called once.
	 */
	protected onStart(): void {}

	/**
	 * Called when the actor enters the s_Scene. It can be called multiple times if the actor is
	 * removed from the s_Scene and added again.
	 */
	protected onEnterScene(): void {}

	/**
	 * Called before physics simulation tick, after collider positions have been updated in the physics world.
	 * @param delta
	 * @param elapsed
	 */
	protected onBeforePhysicsUpdate(delta: number, elapsed: number): void {}

	/**
	 * Called before onUpdate if the Actor's transform has been updated.
	 * @param delta
	 * @param elapsed
	 */
	protected onTransformUpdate(): void {}

	/**
	 * Called before onUpdate.
	 * @param delta
	 * @param elapsed
	 */
	protected onPreUpdate(delta: number, elapsed: number): void {}

	/**
	 * Called every frame when the actor is updated. This is the last step before rendering.
	 * @param delta The time in seconds since the last frame.
	 * @param elapsed The time in seconds since the application was instantiated.
	 */
	protected onUpdate(delta: number, elapsed: number): void {}

	/**
	 * Called after onUpdate.
	 * @param delta
	 * @param elapsed
	 */
	protected onPostUpdate(delta: number, elapsed: number): void {}

	/**
	 * Called when the actor is disabled. This occurs when the actor leaves the s_Scene, or when
	 * actor.disable() is called and may be called multiple times.
	 */
	protected onDisable(): void {}

	/**
	 * Called when the actor leaves the s_Scene. It can be called multiple times if the actor is
	 * removed from the s_Scene and added again.
	 */
	protected onLeaveScene(): void {}

	/**
	 * Called when the actor's destructor is called.
	 */
	protected onDestroy(): void {}

	/**
	 * Called when the output canvas is resized.
	 */
	protected onResize(width: number, height: number): void {}
}

export class SceneLifecycle
{
	/**
	 * Called when the s_Scene is loaded. This is the first method called in the s_Scene's lifecycle.
	 */
	protected onLoad(): void | Promise<void> {}

	/**
	 * Called when the s_Scene is started.
	 */
	protected onStart(): void {}

	/**
	 * Called every frame when the s_Scene is updated.
	 * @param delta The time in seconds since the last frame.
	 * @param elapsed The time in seconds since the application was instantiated.
	 */
	protected onUpdate(delta: number, elapsed: number): void {}

	/**
	 * Called when the s_Scene is stopped. Will be called when the s_Scene is removed from the application or another
	 * s_Scene is loaded.
	 */
	protected onEnd(): void {}
}

export interface RenderPipelineLifecycle
{
	/**
	 * Called when the render pipeline is created, usually during application initialization.
	 * @param scene
	 * @param output
	 */
	onCreate(scene: Scene, output: HTMLCanvasElement): void;

	/**
	 * Called when an ActiveCameraTag is added or removed from an actor. The returned camera
	 * is usually most recently added camera with the ActiveCameraTag.
	 * @param camera
	 */
	onCameraChange(camera: Three.Camera): void;

	/**
	 * Called when the s_Scene is rendered.
	 * @param scene
	 * @param camera
	 */
	onRender(scene: Scene, camera: Three.Camera): void;

	/**
	 * Called when the container is resized.
	 * @param width
	 * @param height
	 */
	onResize(width: number, height: number): void;
}
