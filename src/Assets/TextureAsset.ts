// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three'
import { Asset } from './Asset.ts';

export class TextureAsset extends Asset<Three.Texture>
{
	static TextureLoader: Three.TextureLoader = new Three.TextureLoader();
	constructor(private url: string) { super(); }
	loader(): Promise<Three.Texture>
	{
		return new Promise<Three.Texture>((resolve, reject) =>
		{
			TextureAsset.TextureLoader.load(
				this.url,
				resolve,
				(p) => this.updateProgress(p.loaded / p.total),
				reject
			);
		});
	}
}
