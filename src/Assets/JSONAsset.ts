import { Asset } from './Asset.ts';
import { Serializable } from "../Core/Utilities.ts";

export class JSONAsset extends Asset<Serializable>
{
	constructor(private url: string) { super(); }
	async loader(): Promise<Serializable>
	{
		const res = await this.fetch(this.url);
		if(!res.ok) throw new Error(`Failed to load JSON asset: ${this.url}`);
		return res.json();
	}
}
