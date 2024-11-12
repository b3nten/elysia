/**
 * @module
 *
 * This module contains the OrthographicCameraActor class, which can be used to render Three.OrthographicCameras.
 * It automatically handles canvas resize and aspect ratio.
 *
 * It can be set as the active camera in a scene via the scene.activeCamera property.
 *
 * @example
 * ```ts
 * const camera = new OrthographicCameraActor;
 * scene.activeCamera = camera;
 * ```
 */

// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three';
import { ThreeActor } from "./ThreeActor.ts";

export class OrthographicCameraActor extends ThreeActor<Three.OrthographicCamera>
{
	override object3d = new Three.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
	/**
	 * The left edge of the camera's view.
	 */
	get left(): number { return this.object3d.left; }
	set left(value: number) { this.object3d.left = value; }

	/**
	 * The right edge of the camera's view.
	 */
	get right(): number { return this.object3d.right; }
	set right(value: number) { this.object3d.right = value; }

	/**
	 * The top edge of the camera's view.
	 */
	get top(): number { return this.object3d.top; }
	set top(value: number) { this.object3d.top = value; }

	/**
	 * The bottom edge of the camera's view.
	 */
	get bottom(): number { return this.object3d.bottom; }
	set bottom(value: number) { this.object3d.bottom = value; }

	/**
	 * The near clipping plane.
	 */
	get near(): number { return this.object3d.near; }
	set near(value: number) { this.object3d.near = value; }

	/**
	 * The far clipping plane.
	 */
	get far(): number { return this.object3d.far; }
	set far(value: number) { this.object3d.far = value; }

	/**
	 * The zoom level of the camera.
	 */
	get zoom(): number { return this.object3d.zoom; }
	set zoom(value: number) { this.object3d.zoom = value; }

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
			this.object3d.add(this.#debugHelper);
		}
		else
		{
			this.#debugHelper?.parent?.remove(this.#debugHelper);
			this.#debugHelper?.dispose();
			this.#debugHelper = undefined;
		}
	}

	constructor() {
		super();
		this.object3d = new Three.OrthographicCamera();
	}

	override onResize(x: number, y: number)
	{
		const aspect = x / y;
		this.object3d.left = -1 * aspect;
		this.object3d.right = aspect;
		this.object3d.top = 1;
		this.object3d.bottom = -1;
		this.object3d.updateProjectionMatrix();
	}

	#debug = false;
	#debugHelper?: Three.CameraHelper;
}
