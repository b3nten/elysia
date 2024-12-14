/**
 * @module
 *
 * @description WebGL module provides a collection of utilities and classes for working with Three.js and WebGL.
 */

export { BatchedLodMesh } from "./BatchedLodMesh.js";
export { CanvasPass } from "./CanvasPass.ts";
export { ExponentialHeightFog } from "./ExponentialHeightFog.ts";
export * from "./Noise.ts";
export { setGlobalUniform, getGlobalUniform, addMaterialBeforeCompileCallback, addMaterialBeforeRenderCallback, installMaterialAddon } from "./InstallMaterialAddons.ts";
export { MeshTransmissionMaterial } from "./MeshTransmissionMaterial.ts";