import { ShaderMaterial, Uniform } from "three";
// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three'
import { ShaderPass } from "postprocessing";

export class CanvasMaterial extends ShaderMaterial
{
	constructor(canvas: Three.CanvasTexture)
	{
		super({
			uniforms: {
				tDiffuse: new Uniform(null),
				tCanvas: new Uniform(canvas)
			},
			vertexShader: /* glsl */ `
				varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				}
			`,
			fragmentShader: /* glsl */ `
				uniform sampler2D tDiffuse;
				uniform sampler2D tCanvas;
				varying vec2 vUv;
				void main() {
					vec4 texel = texture2D(tDiffuse, vUv);
					vec4 canvas = texture2D(tCanvas, vUv);
					gl_FragColor = mix(texel, canvas, canvas.a);
				}
			`,
		});
	}
}

export class CanvasPass extends ShaderPass
{
	constructor(canvas: Three.CanvasTexture)
	{
		super(new CanvasMaterial(canvas), "tDiffuse");
	}
}
