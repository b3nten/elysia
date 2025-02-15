import { Asset } from "./asset.ts";
import type { Serializable } from "../util/types.ts";
import * as Three from "three";
import { RGBELoader } from "three/examples/jsm/Addons.js";
import { type GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class TextAsset extends Asset<string> {
	constructor(private url: string) {
		super();
	}
	override async loadImpl(): Promise<string> {
		const res = await fetch(this.url);
		if (!res.ok) throw new Error(`Failed to load Text asset: ${this.url}`);
		return res.text();
	}
}

export class JSONAsset extends Asset<Serializable> {
	constructor(private url: string) {
		super();
	}
	override async loadImpl(): Promise<Serializable> {
		const res = await fetch(this.url);
		if (!res.ok) throw new Error(`Failed to load JSON asset: ${this.url}`);
		return res.json();
	}
}

export class TextureAsset extends Asset<Three.Texture> {
	static TextureLoader: Three.TextureLoader = new Three.TextureLoader();
	constructor(private url: string) {
		super();
	}
	override loadImpl(): Promise<Three.Texture> {
		return new Promise<Three.Texture>((resolve, reject) => {
			TextureAsset.TextureLoader.load(
				this.url,
				resolve,
				undefined,
				reject,
			);
		});
	}
}

export class RGBEAsset extends Asset<Three.DataTexture> {
	static Loader: RGBELoader = new RGBELoader;
	constructor(public url: string) {
		super();
	}
	override loadImpl(): Promise<Three.DataTexture> {
		return new Promise<Three.DataTexture>((resolve, reject) =>
			RGBEAsset.Loader.load(
				this.url,
				resolve,
				undefined,
				reject,
			),
		);
	}
}

export class ImageAsset extends Asset<HTMLImageElement> {
	constructor(private url: string) {
		super();
	}
	override loadImpl(): Promise<HTMLImageElement> {
		return new Promise<HTMLImageElement>((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = this.url;
		});
	}
}

type GLTFAssetType = {
	gltf: GLTF;
	clone: () => GLTF["scene"];
};

export class GLTFAsset extends Asset<GLTFAssetType> {
	static GLTFLoader: GLTFLoader = new GLTFLoader;
	constructor(private url: string) {
		super();
	}
	override loadImpl(): Promise<GLTFAssetType> {
		return new Promise<GLTFAssetType>((resolve, reject) => {
			GLTFAsset.GLTFLoader.load(
				this.url,
				(gltf) => resolve({ gltf: gltf, clone: () => gltf.scene.clone(true) }),
				undefined,
				reject,
			);
		});
	}
}

export class DataTextureAsset extends Asset<Three.DataTexture> {
	static Loader: Three.DataTextureLoader = new Three.DataTextureLoader();
	constructor(public url: string) {
		super();
	}
	override loadImpl(): Promise<Three.DataTexture> {
		return new Promise<Three.DataTexture>((resolve, reject) =>
			DataTextureAsset.Loader.load(
				this.url,
				resolve,
				undefined,
				reject
			),
		);
	}
}

export class ArrayBufferAsset extends Asset<ArrayBuffer> {
	constructor(private url: string) {
		super();
	}
	override async loadImpl(): Promise<ArrayBuffer> {
		const r = await fetch(this.url);
		return await r.arrayBuffer();
	}
}
