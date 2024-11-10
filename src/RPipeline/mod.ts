/**
 * @module RPipeline
 *
 * @description Elysia uses the RenderPipeline interface to manage the rendering of the scene.
 * The RenderPipeline is responsible for instantiating a `Three.WebGLRenderer` and exposing it, along with a `onRender` method.
 * Render Pipelines are notified of resizes and active camera changes via overriding event methods.
 *
 * Along with the abstract RenderPipeline class, Elysia provides two concrete implementations:
 * - `BasicRenderPipeline` - A simple render pipeline using the default Three.js Renderer with support for shadows and tonemapping.
 * - `HighDefRenderPipeline` - An advanced render pipeline using Pmndr's Postprocessing with support for bloom, ssao, and more.
 *
 * @example Basic Render Pipeline
 * ```ts
 * const pipeline = new BasicRenderPipeline({
 *   shadows: true,
 *   toneMapping: Three.ACESFilmicToneMapping
 * });
 * ```
 * @example High Definition Render Pipeline
 * ```ts
 * const pipeline = new HighDefRenderPipeline({
 *   shadows: true,
 *   bloom: true,
 *   ssao: {
 *     intensity: 1.5,
 *     radius: 0.5
 *   }
 * });
 * ```
 */

export * from "./RenderPipeline.ts";
export * from "./BasicRenderPipeline.ts";
export * from "./HighDefinitionRenderPipeline.ts";
export * from "./InstallMaterialAddons.ts";
export * from "./ExponentialHeightFog.ts";
