import { Actor } from "../Scene/Actor.ts";
// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three';
import { ElysiaEventDispatcher } from "../Events/EventDispatcher.ts";
import { ResizeEvent } from "../Core/Resize.ts";
import { ELYSIA_LOGGER } from "../Core/Logger.ts";

export class PerspectiveCameraActor extends Actor<Three.PerspectiveCamera>
{
	override type: string = "PerspectiveCameraActor";

	get fov(): number { return this.object3d.fov; }
	set fov(fov: number)
	{
		this.object3d.fov = fov;
		this.object3d.updateProjectionMatrix();
	}

	get aspect(): number { return this.object3d.aspect; }
	set aspect(aspect: number)
	{
		this.object3d.aspect = aspect;
		this.object3d.updateProjectionMatrix();
	}

	get near(): number { return this.object3d.near; }
	set near(near: number) { this.object3d.near = near; }

	get far(): number { return this.object3d.far; }
	set far(far: number) { this.object3d.far = far; }

	get zoom(): number { return this.object3d.zoom; }
	set zoom(zoom: number) { this.object3d.zoom = zoom; }

	get focus(): number { return this.object3d.focus; }
	set focus(focus: number) { this.object3d.focus = focus; }

	get filmGauge(): number { return this.object3d.filmGauge; }
	set filmGauge(filmGauge: number) { this.object3d.filmGauge = filmGauge; }

	get filmOffset(): number { return this.object3d.filmOffset; }
	set filmOffset(filmOffset: number) { this.object3d.filmOffset = filmOffset; }

	get view(): Three.PerspectiveCamera["view"] { return this.object3d.view; }
	set view(view: any) { this.object3d.view = view; }

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
		super();
		this.onResize = this.onResize.bind(this);
		this.object3d = new Three.PerspectiveCamera();
	}

	override onCreate()
	{
		this.object3d.userData.LOL = true
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
