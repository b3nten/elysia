/**
 * @module
 *
 * This module contains the PerspectiveCameraActor class, which can be used to render Three.PerspectiveCameras.
 * It automatically handles canvas resize and aspect ratio.
 *
 * It can be set as the active camera in a scene via the scene.activeCamera property.
 *
 * @example
 * ```ts
 * const camera = new PerspectiveCameraActor;
 * scene.activeCamera = camera;
 * ```
 */

// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three';
import { ThreeActor } from "./ThreeActor.ts";

export class PerspectiveCameraActor extends ThreeActor<Three.PerspectiveCamera>
{
	/**
	 * The field of view of the camera.
	 */
	get fov(): number { return this.object3d.fov; }
	set fov(fov: number)
	{
		this.object3d.fov = fov;
		this.object3d.updateProjectionMatrix();
	}

	/**
	 * The aspect ratio of the camera.
	 */
	get aspect(): number { return this.object3d.aspect; }
	set aspect(aspect: number)
	{
		this.object3d.aspect = aspect;
		this.object3d.updateProjectionMatrix();
	}

	/**
	 * The near clipping plane.
	 */
	get near(): number { return this.object3d.near; }
	set near(near: number) { this.object3d.near = near; }

	/**
	 * The far clipping plane.
	 */
	get far(): number { return this.object3d.far; }
	set far(far: number) { this.object3d.far = far; }

	/**
	 * The zoom level of the camera.
	 */
	get zoom(): number { return this.object3d.zoom; }
	set zoom(zoom: number) { this.object3d.zoom = zoom; }

	/**
	 * The focus distance of the camera.
	 */
	get focus(): number { return this.object3d.focus; }
	set focus(focus: number) { this.object3d.focus = focus; }

	/**
	 * The aperture of the camera.
	 */
	get filmGauge(): number { return this.object3d.filmGauge; }
	set filmGauge(filmGauge: number) { this.object3d.filmGauge = filmGauge; }

	/**
	 * The film offset of the camera.
	 */
	get filmOffset(): number { return this.object3d.filmOffset; }
	set filmOffset(filmOffset: number) { this.object3d.filmOffset = filmOffset; }

	/**
	 * The view of the camera.
	 */
	get view(): Three.PerspectiveCamera["view"] { return this.object3d.view; }
	set view(view: any) { this.object3d.view = view; }

	/**
	 * Should the actor render a debug helper.
	 */
	get debug(): boolean { return this.#debug; }
	set debug(value: boolean)
	{
		this.#debug = value;
		if(value)
		{
			this.#debugHelper ??= new Three.CameraHelper(this.object3d);
			this.scene?.object3d.add(this.#debugHelper!);
		}
		else
		{
			this.#debugHelper?.removeFromParent();
			this.#debugHelper?.dispose();
			this.#debugHelper = undefined;
		}
	}

	constructor()
	{
		super(new Three.PerspectiveCamera(75, 1, 0.1, 1000));
		this.onResize = this.onResize.bind(this);
	}

	override onCreate()
	{
		if(this.debug) this.scene!.object3d.add(this.#debugHelper!);
	}

	override onUpdate(delta: number, elapsed: number)
	{
		super.onUpdate(delta, elapsed);
		if(this.debug) this.#debugHelper?.update();
	}

	override onDestroy()
	{
		this.#debugHelper?.dispose();
	}

	override onResize(x: number, y: number)
	{
		this.object3d.aspect = x / y;
		this.object3d.updateProjectionMatrix();
	}

	#debug = false;
	#debugHelper?: Three.CameraHelper;
}
