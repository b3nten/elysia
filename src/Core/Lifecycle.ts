import { Actor } from "../Scene/Actor.ts";
import { Scene } from "../Scene/Scene.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';

export interface Destroyable {
	destructor(): void;
}

export interface ActorLifecycle
{
	/**
	 * Called once when the actor is created.
	 * This is the first method called in the actor's lifecycle and will only be called once.
	 * The actor's s_App, Scene, and Parent reference will be defined by the time this is called.
	 */
	onCreate(): void;

	/**
	 * Called when the actor is enabled. This occurs when the actor is added to the s_Scene
	 * and when the actor is enabled after being disabled. This may be called multiple times.
	 */
	onEnable(): void;

	/**
	 * Called before onUpdate() when the actor is started. This will only be called once.
	 */
	onStart(): void;

	/**
	 * Called when the actor enters the s_Scene. It can be called multiple times if the actor is
	 * removed from the s_Scene and added again.
	 */
	onEnterScene(): void;

	/**
	 * Called before physics simulation tick, after collider positions have been updated in the physics world.
	 * @param delta
	 * @param elapsed
	 */
	onBeforePhysicsUpdate(delta: number, elapsed: number): void;

	/**
	 * Called before onUpdate if the Actor's transform has been updated.
	 * @param delta
	 * @param elapsed
	 */
	onTransformUpdate(): void;
	/**
	 * Called every frame when the actor is updated. This is the last step before rendering.
	 * @param delta The time in seconds since the last frame.
	 * @param elapsed The time in seconds since the application was instantiated.
	 */
	onUpdate(delta: number, elapsed: number): void;

	/**
	 * Called when the actor is disabled. This occurs when the actor leaves the s_Scene, or when
	 * actor.disable() is called and may be called multiple times.
	 */
	onDisable(): void;

	/**
	 * Called when the actor leaves the s_Scene. It can be called multiple times if the actor is
	 * removed from the s_Scene and added again.
	 */
	onLeaveScene(): void;

	/**
	 * Called when the actor's destructor is called.
	 */
	onDestroy(): void;

	/**
	 * Called when the output canvas is resized.
	 */
	onResize(width: number, height: number): void;
}

export interface SceneLifecycle
{
	/**
	 * Called when the s_Scene is loaded. This is the first method called in the s_Scene's lifecycle.
	 */
	onLoad(): void | Promise<void>;

	/**
	 * Called when the s_Scene is started.
	 */
	onStart(): void;

	/**
	 * Called every frame when the s_Scene is updated.
	 * @param delta The time in seconds since the last frame.
	 * @param elapsed The time in seconds since the application was instantiated.
	 */
	onUpdate(delta: number, elapsed: number): void;

	/**
	 * Called when the s_Scene is stopped. Will be called when the s_Scene is removed from the application or another
	 * s_Scene is loaded.
	 */
	onEnd(): void;
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
	 * Called when the window is resized.
	 * @param width
	 * @param height
	 */
	onResize(width: number, height: number): void;

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
