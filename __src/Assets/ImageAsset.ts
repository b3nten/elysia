import { Asset } from "./Asset.ts";

export class ImageAsset extends Asset<HTMLImageElement> {
	constructor(private url: string) {
		super();
	}
	loader(): Promise<HTMLImageElement> {
		return new Promise<HTMLImageElement>((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = this.url;
		});
	}
}
