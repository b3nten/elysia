/**
 * @module
 * @description
 * A common usecase in Three.js is running code before the compilation of a material's shader, or before rendering a material.
 * This module provides a way to add global callbacks to any material's onBeforeRender andonBeforeCompile events,
 * without overriding the existing instance callbacks and allowing other users to set their own callback to the material.
 * It also provides a way to propagate global uniforms from Three.WebGlRenderer to each material's shader.
 *
 * Warning: This may not work as expected if the material callback is overrided in the prototype of a custom material class.
 *
 * @example
 * ```ts
 * import * as Three from "three";
 *
 * installMaterialAddonsToPrototypes(Three);
 *
 * const renderer = new Three.WebGLRenderer();
 * setGlobalUnform(renderer, "fogTime", 0)
 * ```
 */

// @ts-types="npm:@types/three@^0.169"
import type * as Three from "three"

/**
 * Internal symbol for the material addon.
 */
export const Internal = Symbol("MaterialAddonInternal");

/**
 * Installs the material addons to all the material prototypes.
 * @param materials
 */
export function installMaterialAddonsToPrototypes(materials: typeof Three.Material[])
{
	for (const Material of materials)
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
			ASSERT_INTERNAL(this);
			if(!this[Internal].cachedOnBeforeRender)
			{
				this[Internal].cachedOnBeforeRender = (...args: any[]) =>
				{
					this[Internal].userOnBeforeRender?.(...args);
					ASSERT_INTERNAL(args[0]);
					for(const callback of args[0][Internal].materialOnBeforeRenderCallbacks ?? [])
					{
						callback(this,...args);
					}
				}
			}
			return this[Internal].cachedOnBeforeRender
		},
		set (v: Function) {
			ASSERT_INTERNAL(this);
			this[Internal].userOnBeforeRender = v;
		}
	})

	Object.defineProperty(material, "onBeforeCompile", {
		get() {
			ASSERT_INTERNAL(this);
			return (shader: any, renderer: any) => {
				ASSERT_INTERNAL(renderer);
				for(const key in renderer[Internal].globalUniforms ?? [])
				{
					shader.uniforms[key] = renderer[Internal].globalUniforms[key];
				}
				this[Internal].userOnBeforeCompile?.(shader, renderer);
				for(const callback of renderer[Internal]?.materialOnBeforeCompileCallbacks ?? [])
				{
					callback(this, shader, renderer);
				}
			}
		},
		set (v: Function) {
			ASSERT_INTERNAL(this);
			this[Internal].userOnBeforeCompile = v;
		}
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
	ASSERT_INTERNAL(renderer);
	// @ts-ignore - extension
	if(!renderer[Internal]?.materialOnBeforeRenderCallbacks) renderer[Internal].materialOnBeforeRenderCallbacks = [];
	// @ts-ignore - extension
	renderer[Internal].materialOnBeforeRenderCallbacks.push(callback);
}

/**
 * Adds a Material.onBeforeCompile callback without overriding the existing one.
 * Requires the addon's to be installed via installMaterialAddonsToPrototypes or installMaterialAddon.
 * @param renderer
 * @param callback
 */
export function addMaterialBeforeCompileCallback(renderer: Three.WebGLRenderer, callback: (material: Three.Material, shader: string) => void)
{
	ASSERT_INTERNAL(renderer);
	// @ts-ignore - extension
	if(!renderer[Internal].materialOnBeforeCompileCallbacks) renderer[Internal].materialOnBeforeCompileCallbacks = [];
	// @ts-ignore - extension
	renderer[Internal].materialOnBeforeCompileCallbacks.push(callback);
}

/**
 * Gets a global uniform from the WebGLRenderer that is propagated to all materials.
 * @param renderer
 * @param key
 */
export function getGlobalUniform<T>(renderer: Three.WebGLRenderer, key: string): T | undefined
{
	ASSERT_INTERNAL(renderer);
	// @ts-ignore - extension
	return renderer[Internal].globalUniforms?.[key]?.value;
}

/**
 * Sets a global uniform on the WebGLRenderer to be propagated to all materials.
 * @param renderer
 * @param key
 * @param value
 */
export function setGlobalUniform(renderer: Three.WebGLRenderer, key: string, value: any)
{
	ASSERT_INTERNAL(renderer);
	// @ts-ignore - extension
	if(!renderer[Internal].globalUniforms) renderer[Internal].globalUniforms = {};
	// @ts-ignore - extension
	if(!renderer[Internal].globalUniforms[key]) renderer[Internal].globalUniforms[key] = { value };
	// @ts-ignore - extension
	else renderer[Internal].globalUniforms[key].value = value;
}

const ASSERT_INTERNAL = (obj: any) => obj[Internal] ?? (obj[Internal] = {});