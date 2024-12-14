import { ShaderMaterial, Uniform } from "three";
// @ts-types="npm:@types/three@^0.169"
import type * as Three from 'three'
import { ShaderPass } from "postprocessing";

/**
 * A custom shader material that blends a base texture with a canvas texture.
 * Extends Three.js ShaderMaterial to provide canvas overlay functionality.
 *
 * @extends {ShaderMaterial}
 *
 * @description
 * This material uses a fragment shader to mix between a diffuse texture (tDiffuse)
 * and a canvas texture (tCanvas) based on the canvas texture's alpha channel.
 * The blending is performed using GLSL's mix function where the canvas alpha
 * determines the blend ratio.
 *
 * @param {Three.CanvasTexture} canvas - The canvas texture to blend with the base texture
 */
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

/**
 * A custom shader pass that blends
 * a base texture with a canvas texture.
 *
 * @extends {ShaderPass}
 * @param {Three.CanvasTexture} canvas - The canvas texture to blend with the base texture
 */
export class CanvasPass extends ShaderPass
{
	constructor(canvas: Three.CanvasTexture)
	{
		super(new CanvasMaterial(canvas), "tDiffuse");
	}
}
