/**
 * @module AssetLoader
 * @description Provides a class for managing and loading multiple assets of different types.
 *
 * @example
 * ```ts
 * const assets = {
 *   logo: new ImageAsset("https://example.com/logo.png"),
 *   backgroundMusic: new AudioAsset("https://example.com/music.mp3")
 * };
 *
 * const loader = new AssetLoader(assets);
 *
 * loader.addEventListener("progress", (e) => console.log(`Overall loading progress: ${e.progress * 100}%`));
 * loader.addEventListener("loaded", () => console.log("All assets loaded!"));
 *
 * await loader.load();
 *
 * const logoImage = loader.unwrap("logo");
 * const music = loader.unwrap("backgroundMusic");
 * ```
 */

import type { Asset } from "./Asset.ts";
import type { Constructor } from "../Shared/Utilities.ts";
import { EventDispatcher } from "../Events/EventDispatcher.ts";
import { LoadedEvent, ProgressEvent, ErrorEvent } from "../Events/Event.ts";
import { ELYSIA_LOGGER } from "../Shared/Logger.ts";

/**
 * Class for managing and loading multiple assets.
 * @template A An object type where keys are asset names and values are Asset instances.
 */
export class AssetLoader<A extends Record<string, Asset<any>>> {
	get loading(): boolean {
		return this.#loading;
	}
	get loaded(): boolean {
		return this.#loaded;
	}
	get error(): Error | null {
		return this.#error;
	}
	get progress(): number {
		return this.#progress;
	}

	constructor(assets: A) {
		this.#assets = assets;
		this.#eventDispatcher = new EventDispatcher();
		this.addEventListener = this.#eventDispatcher.addEventListener.bind(
			this.#eventDispatcher,
		);
		this.removeEventListener = this.#eventDispatcher.removeEventListener.bind(
			this.#eventDispatcher,
		);

		this.load = this.load.bind(this);
		this.unwrap = this.unwrap.bind(this);
		this.get = this.get.bind(this);
	}

	/**
	 * Initiates the loading process for all assets.
	 * @returns {Promise<void> | undefined} A promise that resolves when all assets are loaded, or undefined if already loading/loaded.
	 */
	load(): Promise<void> | undefined {
		if (this.#loaded || this.#loading) return;
		this.#loading = true;
		ELYSIA_LOGGER.debug("Loading assets", this.#assets);

		const promises = Object.values(this.#assets).map((asset) => {
			asset.addEventListener(ProgressEvent, () => {
				const len = Object.keys(this.#assets).length;
				this.#progress =
					Object.values(this.#assets).reduce((acc, a) => acc + a.progress, 0) /
					len;
				this.#eventDispatcher.dispatchEvent(new ProgressEvent(this.#progress));
			});
			return asset.load();
		});

		return Promise.all(promises)
			.then(() => {
				this.#loaded = true;
				this.#loading = false;
				this.#progress = 1;
				this.#eventDispatcher.dispatchEvent(new LoadedEvent());
			})
			.catch((e) => {
				ELYSIA_LOGGER.error("Error loading asset:", e);
				this.#error = e;
				this.#loading = false;
				this.#eventDispatcher.dispatchEvent(new ErrorEvent(e));
				throw e;
			});
	}

	/**
	 * Retrieves the loaded data for a specific asset.
	 * @template T The type of the asset to unwrap.
	 * @param {T} type The key of the asset or the constructor of the asset type.
	 * @param {string} [key] The key of the asset (required when using constructor as type).
	 * @returns The loaded data of the specified asset.
	 * @throws {Error} If assets are not loaded or if the asset is not found.
	 */
	unwrap<T extends keyof A>(type: T): NonNullable<A[T]["data"]>;
	unwrap<T extends Constructor<Asset<any>>>(
		type: T,
		key: string,
	): NonNullable<InstanceType<T>["data"]>;
	unwrap<T>(type: T, key?: string) {
		if (!this.#loaded) throw new Error("Assets not loaded yet.");

		if (typeof key === "string") {
			const maybeAsset = this.#assets[key];
			if (!maybeAsset) throw new Error("Asset not found.");
			if (!(maybeAsset instanceof (type as Constructor<Asset<any>>)))
				throw new Error("Asset type mismatch.");
			return maybeAsset.data;
		} else {
			const maybeAsset = this.#assets[type as keyof A];
			if (!maybeAsset) throw new Error("Asset not found.");
			return maybeAsset.data;
		}
	}

	/**
	 * Retrieves an asset instance by its key.
	 * @template T The type of the asset to retrieve.
	 * @param {T | string} a The key of the asset.
	 * @returns {A[T] | T | undefined} The asset instance or undefined if not found.
	 */
	get<T extends keyof A>(a: T): A[T];
	get<T extends Asset<any>>(a: string): T | undefined;
	get<T extends Asset<any>>(a: string): T | undefined {
		return this.#assets[a] as T;
	}

	addEventListener: EventDispatcher["addEventListener"];
	removeEventListener: EventDispatcher["removeEventListener"];

	#eventDispatcher = new EventDispatcher();
	#progress: number = 0;
	#loaded = false;
	#loading = false;
	#error: Error | null = null;
	#assets: A;
}
