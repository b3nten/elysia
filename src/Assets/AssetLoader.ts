import { Asset } from "./Asset.ts";
import { Constructor } from "../Shared/Utilities.ts";
import { ElysiaEventDispatcher } from "../Events/EventDispatcher.ts";
import { LoadedEvent, ProgressEvent, ErrorEvent } from "../Events/Event.ts";
import { ELYSIA_LOGGER } from "../Shared/Logger.ts";

export class AssetLoader<A extends Record<string, Asset<any>>>
{

	get loading(): boolean { return this.#loading; }
	get loaded(): boolean { return this.#loaded; }
	get error(): Error | null { return this.#error; }
	get progress(): number { return this.#progress; }

	constructor(assets: A)
	{
		this.#assets = assets;
		this.#eventDispatcher = new ElysiaEventDispatcher;
		this.addEventListener = this.#eventDispatcher.addEventListener.bind(this.#eventDispatcher);
		this.removeEventListener = this.#eventDispatcher.removeEventListener.bind(this.#eventDispatcher);

		this.load = this.load.bind(this);
		this.unwrap = this.unwrap.bind(this);
		this.get = this.get.bind(this);
	}

	load(): Promise<void> | undefined
	{
		if(this.#loaded || this.#loading) return;
		this.#loading = true;
		ELYSIA_LOGGER.debug("Loading assets", this.#assets);

		const promises = Object.values(this.#assets).map(asset => {
			asset.addEventListener(ProgressEvent, () => {
				const len = Object.keys(this.#assets).length;
				this.#progress = Object.values(this.#assets).reduce((acc, a) => acc + a.progress, 0) / len;
				this.#eventDispatcher.dispatchEvent(new ProgressEvent(this.#progress));
			})
			return asset.load()
		});

		return Promise.all(promises).then(() => {
			this.#loaded = true;
			this.#loading = false;
			this.#progress = 1;
			this.#eventDispatcher.dispatchEvent(new LoadedEvent);
		}).catch(e => {
			ELYSIA_LOGGER.error('Error loading asset:', e);
			this.#error = e;
			this.#loading = false;
			this.#eventDispatcher.dispatchEvent(new ErrorEvent(e));
			throw e;
		})
	}

	unwrap<T extends keyof A>(type: T): NonNullable<A[T]["data"]>;
	unwrap<T extends Constructor<Asset<any>>>(type: T, key: string): NonNullable<InstanceType<T>["data"]>;
	unwrap<T>(type: T, key?: string)
	{
		if(!this.#loaded) throw new Error("Assets not loaded yet.");

		if(typeof key === "string") {
			const maybeAsset = this.#assets[key];
			if(!maybeAsset) throw new Error("Asset not found.");
			if(!(maybeAsset instanceof (type as Constructor<Asset<any>>))) throw new Error("Asset type mismatch.");
			return maybeAsset.data;
		} else {
			const maybeAsset = this.#assets[type as keyof A];
			if(!maybeAsset) throw new Error("Asset not found.");
			return maybeAsset.data
		}
	}

	get<T extends keyof A>(a: T): A[T];
	get<T extends Asset<any>>(a: string): T | undefined
	get<T extends Asset<any>>(a: string): T | undefined
	{
		return this.#assets[a] as T;
	}

	addEventListener: ElysiaEventDispatcher["addEventListener"];
	removeEventListener: ElysiaEventDispatcher["removeEventListener"];

	#eventDispatcher = new ElysiaEventDispatcher;
	#progress: number = 0;
	#loaded = false;
	#loading = false;
	#error: Error | null = null;
	#assets: A;
}
