/**
 * @module
 * @description
 * A common usecase in Three.js is running code before the compilation of a material's shader, or before rendering a material.
 * This module provides a way to add global callbacks to any material's onBeforeRender, onBeforeCompile, and onAfterRender events,
 * without overriding the existing instance callbacks and allowing other users to set their own callback to the material.
 * It also provides a way to propagate global uniforms from Three.WebGlRenderer.globalUniforms property to each material's shader.
 *
 * Warning: This does not work as expected if the material callback is overrided in the prototype of a custom material class.
 *
 * @example
 * ```ts
 * import * as Three from "three";
 *
 * installMaterialAddonsToPrototypes(Three);
 *
 * const renderer = new Three.WebGLRenderer();
 * renderer.globalUniforms = { time: { value: 0 } };
 * ```
 */

// @ts-types="npm:@types/three@^0.169"
import type * as Three from "three"

/**
 * Installs the material addons to all the material prototypes.
 * @param Three
 */
export function installMaterialAddonsToPrototypes(Three: typeof import("three"))
{
	const Materials = [
		Three.ShadowMaterial,
		Three.SpriteMaterial,
		Three.RawShaderMaterial,
		Three.ShaderMaterial,
		Three.PointsMaterial,
		Three.MeshPhysicalMaterial,
		Three.MeshStandardMaterial,
		Three.MeshPhongMaterial,
		Three.MeshToonMaterial,
		Three.MeshNormalMaterial,
		Three.MeshLambertMaterial,
		Three.MeshDepthMaterial,
		Three.MeshDistanceMaterial,
		Three.MeshBasicMaterial,
		Three.MeshMatcapMaterial,
		Three.LineDashedMaterial,
		Three.LineBasicMaterial,
		Three.Material,
	];

	for (const Material of Materials)
	{
		if(!Material?.prototype) continue;
		installMaterialAddon(Material.prototype);
	}
}

/**
 * Installs the material addons to the given material.
 * @param material
 */
export function installMaterialAddon(material: any)
{
	Object.defineProperty(material, "onBeforeRender", {
		get() {
			if(!this.__cachedOnBeforeRender) {
				this.__cachedOnBeforeRender = (...args: any[]) => {
					this.userOnBeforeRender?.(...args);
					for(const callback of args[0]?.materialOnBeforeRenderCallbacks ?? [])
					{
						callback(this,...args);
					}
				}
			}
			return this.__cachedOnBeforeRender
		},
		set (v: Function) { this.userOnBeforeRender = v; }
	})

	Object.defineProperty(material, "onBeforeCompile", {
		get() {
			return (shader: any, renderer: any) => {
				for(const key in renderer.globalUniforms)
				{
					shader.uniforms[key] = renderer.globalUniforms[key];
				}
				this.userOnBeforeCompile?.(shader, renderer);
				for(const callback of shader?.materialOnBeforeCompileCallbacks ?? [])
				{
					callback(this, shader, renderer);
				}
			}
		},
		set (v: Function) { this.userOnBeforeCompile = v; }
	})

	Object.defineProperty(material, "onAfterRender", {
		get()
		{
			if(!this.__cachedOnAfterRender) {
				this.__cachedOnAfterRender = (...args: any[]) => {
					this.userOnAfterRender?.(...args);
					for (const callback of args[0]?.materialOnAfterRenderCallbacks ?? []) {
						callback(this, ...args);
					}
				}
			}
			return this.__cachedOnAfterRender;
		},
		set (v: Function) { this.userOnAfterRender = v; }
	})
}

/**
 * Adds a Material.onBeforeRender callback without overriding the existing one.
 * Requires the addon's to be installed via installMaterialAddonsToPrototypes or installMaterialAddon.
 * @param renderer
 * @param callback
 */
export function addMaterialBeforeRenderCallback(renderer: Three.WebGLRenderer, callback: (material: Three.Material) => void)
{
	if(!renderer.materialOnBeforeRenderCallbacks) renderer.materialOnBeforeRenderCallbacks = [];
	renderer.materialOnBeforeRenderCallbacks.push(callback);
}

/**
 * Adds a Material.onBeforeCompile callback without overriding the existing one.
 * Requires the addon's to be installed via installMaterialAddonsToPrototypes or installMaterialAddon.
 * @param renderer
 * @param callback
 */
export function addMaterialBeforeCompileCallback(renderer: Three.WebGLRenderer, callback: (material: Three.Material, shader: string) => void)
{
	if(!renderer.materialOnBeforeCompileCallbacks) renderer.materialOnBeforeCompileCallbacks = [];
	renderer.materialOnBeforeCompileCallbacks.push(callback);
}

/**
 * Adds a Material.onAfterRender callback without overriding the existing one.
 * Requires the addon's to be installed via installMaterialAddonsToPrototypes or installMaterialAddon.
 * @param renderer
 * @param callback
 */
export function addMaterialAfterRenderCallback(renderer: Three.WebGLRenderer, callback: (material: Three.Material) => void)
{
	if(!renderer.materialOnAfterRenderCallbacks) renderer.materialOnAfterRenderCallbacks = [];
	renderer.materialOnAfterRenderCallbacks.push(callback);
}

export function getGlobalUniform<T>(renderer: Three.WebGLRenderer, key: string): T | undefined
{
	return renderer.globalUniforms?.[key]?.value;
}

/**
 * Sets a global uniform on the WebGLRenderer to be propagated to all materials.
 * @param renderer
 * @param key
 * @param value
 */
export function setGlobalUniform(renderer: Three.WebGLRenderer, key: string, value: any)
{
	if(!renderer.globalUniforms) renderer.globalUniforms = {};
	if(!renderer.globalUniforms[key]) renderer.globalUniforms[key] = { value };
	else renderer.globalUniforms[key].value = value;
}