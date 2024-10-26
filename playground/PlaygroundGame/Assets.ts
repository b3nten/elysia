import { AssetLoader, GLTFAsset } from "../../src/Assets/mod.ts"

export const playgroundAssets = new AssetLoader({
	Map: new GLTFAsset("/assets/Map.glb")
})