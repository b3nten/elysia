import { Asset } from "./Asset.ts"
// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three'

export class DataTextureAsset extends Asset<Three.DataTexture>
{
	constructor(public url: string)
	{
		super()
	}

	static Loader: Three.DataTextureLoader = new Three.DataTextureLoader;

	override loader(): Promise<Three.DataTexture>
	{
		return new Promise<Three.DataTexture>((resolve) =>
			DataTextureAsset.Loader.load(
				this.url,
				(texture) => resolve(texture),
				(p) => {this.updateProgress(p.loaded / p.total)}
			),
		)
	}
}
