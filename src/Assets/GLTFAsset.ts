import { Asset } from "./Asset.ts";
// @ts-types="npm:@types/three@^0.169.0/examples/jsm/loaders/GLTFLoader"
import {
	type GLTF,
	GLTFLoader,
} from "three/examples/jsm/loaders/GLTFLoader.js";

type GLTFAssetType = {
	gltf: GLTF;
	clone: () => GLTF["scene"];
};

export class GLTFAsset extends Asset<GLTFAssetType> {
	static GLTFLoader: GLTFLoader = new GLTFLoader();
	constructor(private url: string) {
		super();
	}
	loader(): Promise<GLTFAssetType> {
		return new Promise<GLTFAssetType>((resolve, reject) => {
			GLTFAsset.GLTFLoader.load(
				this.url,
				(gltf) => resolve({ gltf: gltf, clone: () => gltf.scene.clone(true) }),
				(p) => this.updateProgress(p.loaded / p.total),
				reject,
			);
		});
	}
}
