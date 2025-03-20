import type { IRenderer } from "../renderer/mod.ts";
import * as Three from "three";
import { Application } from "../core/application.ts";
import type { ThreeScene } from "./scene.ts";
import { CThreePerspectiveCamera } from "./components.ts";

type BasicRenderPipelineArguments = Three.WebGLRendererParameters & {
	toneMapping?: Three.ToneMapping;
	toneMappingExposure?: number;
	devicePixelRatio?: number;
	shadows?: boolean;
};

export class ThreeRenderer implements IRenderer {
	webGLRenderer: Three.WebGLRenderer;
	declare canvas: HTMLCanvasElement;

	constructor(protected args: BasicRenderPipelineArguments = {}) {}

	onSceneLoaded(scene: any) {
		this.webGLRenderer = new Three.WebGLRenderer({
			...this.args,
			canvas: this.canvas,
		});

		this.webGLRenderer.shadowMap.enabled = this.args.shadows ?? true;
		this.webGLRenderer.shadowMap.type = Three.PCFSoftShadowMap;

		if (this.args.devicePixelRatio) {
			this.webGLRenderer.setPixelRatio(this.args.devicePixelRatio);
		} else {
			this.webGLRenderer.setPixelRatio(globalThis.devicePixelRatio);
		}

		if (this.args.toneMapping) {
			this.webGLRenderer.toneMapping =
				this.args.toneMapping ?? Three.ACESFilmicToneMapping;
		}

		if (this.args.toneMappingExposure) {
			this.webGLRenderer.toneMappingExposure = this.args.toneMappingExposure;
		}
	}

	onRender(delta: number, elapsed: number) {
		let scene = Application.instance.scene as ThreeScene;
		// @ts-ignore
		let camera = scene.getComponents(CThreePerspectiveCamera).values().next()
			.value.object3d;

		if (!camera) {
			throw new Error("No camera found in scene");
		}

		this.webGLRenderer.render(scene.threeRoot, camera);
	}

	onCanvasResize(width: number, height: number) {
		this.webGLRenderer.setSize(width, height, false);
		this.webGLRenderer.setPixelRatio(globalThis.devicePixelRatio);
	}
}
