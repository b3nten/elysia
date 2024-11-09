import { RenderPipeline } from "./RenderPipeline.ts";
import { Scene } from "../Scene/Scene.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';
import * as Postprocessing from "postprocessing"

Postprocessing.OverrideMaterialManager.workaroundEnabled = true;

let _PREPASS_DEPTH = false;
export const PREPASS_DEPTH = () => !!_PREPASS_DEPTH;

interface HDRenderPipelineConstructorArguments
{
	bloom?: {
		blendMode?: Postprocessing.BlendFunction
	}
	chromaticAberration?: {}
	smaa?: {}
	smao?: {}
	toneMapping?: {}
	fog?: Three.FogExp2 | Three.Fog | ExponentialHeightFog,
	depthPrePass?: boolean
}

class ExponentialHeightFog
{

}

class DepthPrePass extends Postprocessing.RenderPass {

	constructor(scene: Three.Scene, camera: Three.Camera)
	{
		class EmptyFragShader extends Three.ShaderMaterial
		{
			override vertexShader: string = `
			void main()
			{
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
			`
			override fragmentShader: string = `
			void main()
			{
				gl_FragColor = vec4(0., 1.);
			}
			`
		}

		super(scene, camera, new EmptyFragShader);

		// super(scene, camera, new EmptyFragShader);

		this.ignoreBackground = true;
	}

	override render(
		renderer: Three.WebGLRenderer,
		inputBuffer: Three.WebGLRenderTarget,
		outputBuffer: Three.WebGLRenderTarget,
		deltaTime?: number | undefined,
		stencilTest?: boolean | undefined
	): void {
		renderer.getContext().depthFunc(renderer.getContext().LEQUAL);
		super.render(renderer, inputBuffer, outputBuffer, deltaTime, stencilTest);
	}
}

class MainRenderPass extends Postprocessing.RenderPass {
	constructor(scene: Three.Scene, camera: Three.Camera) {
		super(scene, camera);
		// Avoid clearing the depth buffer before rendering as that would throw out all the depth data
		// computed in the pre-pass
		this.clearPass.enabled = false;
	}

	override render(
		renderer: Three.WebGLRenderer,
		inputBuffer: Three.WebGLRenderTarget,
		outputBuffer: Three.WebGLRenderTarget,
		deltaTime?: number | undefined,
		stencilTest?: boolean | undefined
	) {
		const ctx = renderer.getContext();

		// Set the depth test function to EQUAL which uses the pre-computed data in the depth buffer to
		// automatically discard fragments that aren't visible to the camera
		ctx.depthFunc(ctx.LEQUAL);
		ctx.depthRange(0.0, 0.999999);
		_PREPASS_DEPTH = true;
		super.render.apply(this, [renderer, inputBuffer, outputBuffer, deltaTime, stencilTest]);
		_PREPASS_DEPTH = false;
		ctx.depthFunc(ctx.LESS);
		ctx.depthRange(0.0, 1.0);
	}
}

/**
 * A basic render pipeline that uses Three.js to render the scene with the default WebGLRenderer.
 */
export class HDRenderPipeline extends RenderPipeline
{

	public bloom = new Postprocessing.SelectiveBloomEffect;
	public chromaticAberration = new Postprocessing.ChromaticAberrationEffect;
	public smaa = new Postprocessing.SMAAEffect;
	public ssao = new Postprocessing.SSAOEffect;
	public toneMapping = new Postprocessing.ToneMappingEffect;

	constructor(args: HDRenderPipelineConstructorArguments = {})
	{
		super();
		this.effectComposer = new Postprocessing.EffectComposer(undefined, {
			frameBufferType: Three.HalfFloatType,
			depthBuffer: true,
			stencilBuffer: true,
			alpha: true,
		})
		this.toneMapping.mode = Postprocessing.ToneMappingMode.ACES_FILMIC
		// disabled for now, as we need a separate occlusion scene for occlusion meshes based on LOD (todo)
		this.#depthPrepass = false;
	}

	onCreate(scene: Scene, output: HTMLCanvasElement) {

		this.renderer = new Three.WebGLRenderer({
			canvas: output,
			alpha: false,
			antialias: false,
			stencil: false,
			depth: false,
			precision: "highp",
			powerPreference: "high-performance",
		});

		this.renderer.outputColorSpace = Three.SRGBColorSpace;

		this.effectComposer.setRenderer(this.renderer);
		this.effectComposer.setMainScene(scene.object3d);
		this.effectComposer.setMainCamera(scene.activeCamera);

		let renderPass: Postprocessing.RenderPass;

		if(this.#depthPrepass)
		{
			this.renderer.autoClear = false;
			this.renderer.autoClearDepth = false;
			const prepassDepth = new DepthPrePass(scene.object3d, scene.activeCamera);
			renderPass = new MainRenderPass(scene.object3d, scene.activeCamera);
			this.effectComposer.addPass(prepassDepth);
		}
		else
		{
			renderPass = new Postprocessing.RenderPass(scene.object3d, scene.activeCamera);
		}

		const effectPass = new Postprocessing.EffectPass(
			scene.activeCamera,
			this.smaa,
			this.toneMapping,
		)

		this.effectComposer.addPass(renderPass);
		this.effectComposer.addPass(effectPass)
	}

	override onResize(width: number, height: number)
	{
		this.renderer?.setSize(width, height, false);
		this.renderer?.setPixelRatio(globalThis.devicePixelRatio);
		this.effectComposer.setSize(width, height);
	}

	override onCameraChange(camera: Three.Camera)
	{
		console.log("camera change", camera);
		this.effectComposer.setMainCamera(camera);
	}

	override onRender(scene: Scene, camera: Three.Camera)
	{
		this.effectComposer.render();
	}

	getRenderer(): Three.WebGLRenderer { return this.renderer!; }

	private renderer?: Three.WebGLRenderer;
	private effectComposer: Postprocessing.EffectComposer;
	#depthPrepass = false;
}
