import { Asset } from "./Asset.ts";

export class ArrayBufferAsset extends Asset<ArrayBuffer>
{
	constructor(private url: string) { super(); }
	async loader(): Promise<ArrayBuffer>
	{
		const r = await this.fetch(this.url);
		if(!r.ok) throw new Error(`Failed to load array buffer: ${r.statusText}`);
		return await r.arrayBuffer();
	}
}
