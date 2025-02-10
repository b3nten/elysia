import { Asset } from "./Asset.ts";
// @ts-types="npm:@types/three@^0.169.0"
import type * as Three from "three";
// @ts-types="npm:@types/three@^0.169.0/examples/jsm/Addons"
import { RGBELoader } from "three/examples/jsm/Addons.js";

export class RGBEAsset extends Asset<Three.DataTexture> {
	static Loader: RGBELoader = new RGBELoader();
	constructor(public url: string) {
		super();
	}
	override loader(): Promise<Three.DataTexture> {
		return new Promise<Three.DataTexture>((resolve) =>
			RGBEAsset.Loader.load(
				this.url,
				(texture) => resolve(texture),
				(p) => {
					this.updateProgress(p.loaded / p.total);
				},
			),
		);
	}
}
