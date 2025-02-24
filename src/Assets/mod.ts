/**
 * @module Assets
 * @description This module provides an asset management system for loading and handling various types of assets.
 *
 * The Assets module includes:
 * - A base Asset class for creating custom asset types
 * - An AssetLoader for managing and loading multiple assets
 * - Specialized asset classes for common data types (ArrayBuffer, Audio, Image, JSON, Text, GLTF, RGBE, DataTexture, Texture)
 *
 * @example
 * ```ts
 *
 * // Define your assets
 * const assets = {
 *   logo: new ImageAsset("https://example.com/logo.png"),
 *   backgroundMusic: new AudioAsset("https://example.com/music.mp3"),
 *   config: new JSONAsset("https://example.com/config.json")
 * };
 *
 * // Create an AssetLoader
 * const loader = new AssetLoader(assets);
 *
 * // Add event listeners
 * loader.addEventListener("progress", (e) => console.log(`Loading progress: ${e.progress * 100}%`));
 * loader.addEventListener("loaded", () => console.log("All assets loaded!"));
 *
 * // Load assets
 * await loader.load();
 *
 * // Use loaded assets
 * const logoImage = loader.unwrap("logo");
 * const music = loader.unwrap("backgroundMusic");
 * const configData = loader.unwrap("config");
 *
 * // You can also get the asset instances directly
 * const logoAsset = loader.get("logo");
 * console.log(logoAsset.progress); // 1 (fully loaded)
 * ```
 */

export { Asset } from "./Asset.ts";
export { AssetLoader } from "./AssetLoader.ts";
export { ErrorEvent, LoadedEvent, BeginLoadEvent, ProgressEvent } from "./Events.ts"
export { ArrayBufferAsset } from "./ArrayBufferAsset.ts";
export { AudioAsset } from "./AudioAsset.ts";
export { ImageAsset } from "./ImageAsset.ts";
export { JSONAsset } from "./JSONAsset.ts";
export { TextAsset } from "./TextAsset.ts";
export { GLTFAsset } from "./GLTFAsset.ts";
export { RGBEAsset } from "./RGBEAsset.ts";
export { DataTextureAsset } from "./DataTextureAsset.ts";
export { TextureAsset } from "./TextureAsset.ts";
