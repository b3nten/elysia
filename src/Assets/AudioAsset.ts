import { Asset } from "./Asset.ts";
import { Audio, type AudioConstructorArguments } from "../Audio/Audio.ts";

export class AudioAsset extends Asset<Audio>
{
	constructor(private args: Omit<AudioConstructorArguments, "bytes"> & { url: string }) { super(); }
	async loader(): Promise<Audio>
	{
		const r = await this.fetch(this.args.url);
		const b = await r.arrayBuffer();
		return new Audio({ ...this.args, bytes: b });
	}
}
