import { RenderPipeline } from "./RenderPipeline.ts";
import { Scene } from "../Core/Scene.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';

type BasicRenderPipelineArguments = Three.WebGLRendererParameters & {
	toneMapping?: Three.ToneMapping;
	toneMappingExposure?: number;
	devicePixelRatio?: number;
	shadows?: boolean;
};

/**
 * A basic render pipeline that uses Three.js to render the scene with the default WebGLRenderer.
 */
export class BasicRenderPipeline extends RenderPipeline
{
	constructor(args: BasicRenderPipelineArguments = {})
	{
		super();
		this.args = args;
	}

	onCreate(scene: Scene, output: HTMLCanvasElement) {
		this.renderer = new Three.WebGLRenderer({ ...this.args, canvas: output });
		this.renderer.shadowMap.enabled = this.args.shadows ?? true;
		this.renderer.shadowMap.type = Three.PCFSoftShadowMap;
		if (this.args.devicePixelRatio) { this.renderer.setPixelRatio(this.args.devicePixelRatio); }
		else { this.renderer.setPixelRatio(window.devicePixelRatio); }
		if (this.args.toneMapping) { this.renderer.toneMapping = this.args.toneMapping ?? Three.ACESFilmicToneMapping; }
		if (this.args.toneMappingExposure) { this.renderer.toneMappingExposure = this.args.toneMappingExposure; }
	}

	override onResize(width: number, height: number)
	{
		console.log("Resizing " + width + " " + height);
		this.renderer?.setSize(width, height, false);
		this.renderer?.setPixelRatio(window.devicePixelRatio);
	}

	onRender(scene: Scene, camera: Three.Camera)
	{
		this.renderer!.render(scene.object3d, camera);
	}

	getRenderer(): Three.WebGLRenderer { return this.renderer!; }

	private renderer?: Three.WebGLRenderer;
	private args: BasicRenderPipelineArguments;
}
