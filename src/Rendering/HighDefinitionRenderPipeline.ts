// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';
import { RenderPipeline } from "./RenderPipeline.ts";
import type { Scene } from "../Core/Scene.ts";
import * as Postprocessing from "postprocessing"
import { ExponentialHeightFog } from "../WebGL/ExponentialHeightFog.ts";

Postprocessing.OverrideMaterialManager.workaroundEnabled = true;

let _PREPASS_DEPTH = false;
export const PREPASS_DEPTH = () => !!_PREPASS_DEPTH;

interface HDRenderPipelineConstructorArguments
{
	/**
	 * The number of samples to use for multisampling.
	 */
	multisampling?: number

	/**
	 * Enable SMAA antialiasing.
	 * If true, a new SMAAEffect will be created.
	 * If an SMAAEffect is provided, it will be used.
	 * @default false
	 */
	smaa?: boolean | Postprocessing.SMAAEffect

	/**
	 * The tone mapping mode to use.
	 * @default Postprocessing.ToneMappingMode.ACES_FILMIC
	 */
	toneMapping?: Postprocessing.ToneMappingMode

	/**
	 * An array of Postprocessing.Effect instances to apply to the scene.
	 */
	effects?: Postprocessing.Effect[]

	/**
	 * See Postprocessing.EffectComposer for more information.
	 */
	alpha?: boolean

	/**
	 * @experimental
	 * Accepts Three.js default Fog or FogExp2, or a custom ExponentialHeightFog instance with support for noise.
	 */
	fog?: Three.FogExp2 | Three.Fog | ExponentialHeightFog,

	/**
	 * @experimental
	 * Enable a depth pre-pass to improve performance on scenes with complex shaders.
	 * This will render the scene to the depth buffer first, then render the scene again
	 * with the main shader.
	 */
	depthPrePass?: boolean
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
		_PREPASS_DEPTH = true;
		super.render(renderer, inputBuffer, outputBuffer, deltaTime, stencilTest);
		_PREPASS_DEPTH = false;
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
		super.render.apply(this, [renderer, inputBuffer, outputBuffer, deltaTime, stencilTest]);
		ctx.depthFunc(ctx.LESS);
		ctx.depthRange(0.0, 1.0);
	}
}
/**
 * A basic render pipeline that uses Three.js to render the scene with the default WebGLRenderer.
 */
export class HDRenderPipeline extends RenderPipeline
{

	get multisampling(): number { return this.effectComposer.multisampling; }
	set multisampling(v: number) { this.effectComposer.multisampling = v; }

	get toneMappingMode(): Postprocessing.ToneMappingMode { return this.toneMapping.mode; }
	set toneMappingMode(v: Postprocessing.ToneMappingMode) { this.toneMapping.mode = v; }

	get fog(): Three.FogExp2 | Three.Fog | ExponentialHeightFog | undefined { return this.#fog; }
	set fog(v: Three.FogExp2 | Three.Fog | ExponentialHeightFog | undefined)
	{
		this.#fog = v;
		// @ts-ignore - custom fog type
		if(this.scene) this.scene.object3d.fog = v;
	}

	public smaa?: Postprocessing.SMAAEffect;

	public toneMapping = new Postprocessing.ToneMappingEffect;

	public effectComposer: Postprocessing.EffectComposer;

	constructor(args: HDRenderPipelineConstructorArguments = {})
	{
		super();
		this.effectComposer = new Postprocessing.EffectComposer(undefined, {
			frameBufferType: Three.HalfFloatType,
			depthBuffer: true,
			stencilBuffer: true,
			alpha: !!args.alpha,
			multisampling: args.multisampling ?? 0,
		})

		// disabled for now, as we need a separate occlusion scene for occlusion meshes based on LOD (todo)
		this.#depthPrepass = false;

		this.#fog = args.fog;

		if(args.effects)
		{
			this.effects = args.effects;
		}

		if(args.toneMapping)
		{
			this.toneMapping.mode = args.toneMapping;
		}
		else
		{
			this.toneMapping.mode = Postprocessing.ToneMappingMode.ACES_FILMIC;
		}

		if(args.smaa)
		{
			this.smaa = args.smaa === true ? new Postprocessing.SMAAEffect() : args.smaa;
		}
	}

	onCreate(scene: Scene, output: HTMLCanvasElement) {
		this.scene = scene;

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
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = Three.PCFSoftShadowMap;

		if(this.#fog)
		{
			// @ts-ignore - custom fog type
			scene.object3d.fog = this.#fog;
			if(this.#fog instanceof ExponentialHeightFog)
			{
				// see ExponentialHeightFog.ts
				this.#fog.renderer = this.renderer;
			}
		}

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
			...([...this.effects, this.smaa, this.toneMapping].filter(Boolean) as Array<Postprocessing.Effect>),
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
		this.effectComposer.setMainCamera(camera);
	}

	override onRender(scene: Scene, camera: Three.Camera)
	{
		if(this.#fog instanceof ExponentialHeightFog)
		{
			this.#fog.updateUniforms(0.016);
		}
		this.effectComposer.render();
	}

	getRenderer(): Three.WebGLRenderer { return this.renderer!; }

	private renderer?: Three.WebGLRenderer;
	private effects: Array<Postprocessing.Effect> = [];
	private scene?: Scene;
	#fog?: Three.FogExp2 | Three.Fog | ExponentialHeightFog;
	#depthPrepass: boolean = false;
}
