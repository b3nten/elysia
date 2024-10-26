import { Actor } from "../Scene/Actor.ts";
// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three';
import { ElysiaEventDispatcher } from "../Events/EventDispatcher.ts";
import { ResizeEvent } from "../Core/Resize.ts";

export class OrthographicCameraActor extends Actor<Three.OrthographicCamera>
{
	override type: string = "OrthographicCameraActor";

	get left(): number { return this.object3d.left; }
	set left(value: number) { this.object3d.left = value; }

	get right(): number { return this.object3d.right; }
	set right(value: number) { this.object3d.right = value; }

	get top(): number { return this.object3d.top; }
	set top(value: number) { this.object3d.top = value; }

	get bottom(): number { return this.object3d.bottom; }
	set bottom(value: number) { this.object3d.bottom = value; }

	get near(): number { return this.object3d.near; }
	set near(value: number) { this.object3d.near = value; }

	get far(): number { return this.object3d.far; }
	set far(value: number) { this.object3d.far = value; }

	get zoom(): number { return this.object3d.zoom; }
	set zoom(value: number) { this.object3d.zoom = value; }

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
