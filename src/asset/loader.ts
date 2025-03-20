import type { Asset } from "./asset.ts";
import type { Constructor } from "../util/types.ts";
import { Future } from "../util/future.ts";
import { EventDispatcher } from "../events/dispatcher.ts";
import { createEvent } from "../events/mod.ts";
import { elysiaLogger } from "../core/log.ts";

export const AssetLoaderProgressEvent = createEvent<number>(
	"Elysia::AssetLoaderProgressEvent",
);
export const AssetLoaderErrorEvent = createEvent<Error>(
	"Elysia::AssetLoaderErrorEvent",
);
export const AssetLoaderLoadedEvent = createEvent<AssetLoader<any>>(
	"Elysia::AssetLoaderLoadedEvent",
);

export class AssetLoader<A extends Record<string, Asset<any>>>
	implements Promise<A>
{
	state: "idle" | "loading" | "loaded" | "error" = "idle";

	promise = new Future<A>();

	progress = 0;

	protected emitter = new EventDispatcher();

	addEventListener = this.emitter.addEventListener.bind(this.emitter);

	removeEventListener = this.emitter.removeEventListener.bind(this.emitter);

	constructor(public assets: A) {}

	/**
	 * Initiates the loading process for all assets.
	 * @returns {Promise<void> | undefined} A promise that resolves when all assets are loaded, or undefined if already loading/loaded.
	 */
	async load() {
		if (["loaded", "loading", "error"].some((x) => this.state === x)) {
			return this;
		}

		DEV: elysiaLogger.debug("Loading assets:", this);

		// load asset
		this.state = "loading";

		let promises: Promise<unknown>[] = [];
		let settled = 0;

		for (const asset of Object.values(this.assets)) {
			promises.push(
				asset
					.load()
					.then((a) => {
						this.progress = ++settled / promises.length;
						this.emitter.dispatchEvent(AssetLoaderProgressEvent, this.progress);
					})
					.catch((e) => {
						this.state = "error";
						this.emitter.dispatchEvent(AssetLoaderErrorEvent, e);
						this.promise.reject(e);
					}),
			);
		}

		try {
			await Promise.all(promises);
			this.state = "loaded";
			this.progress = 1;
			this.emitter.dispatchEvent(AssetLoaderLoadedEvent, this);
			this.promise.resolve(this.assets);
		} catch {
			this.state = "error";
			this.emitter.dispatchEvent(
				AssetLoaderErrorEvent,
				new Error("Failed to load assets"),
			);
			this.promise.reject();
		}

		return this.promise;
	}

	unwrap<T extends keyof A>(type: T): NonNullable<A[T]["data"]>;
	unwrap<T extends Constructor<Asset<any>>>(
		type: T,
		key: string,
	): NonNullable<InstanceType<T>["data"]>;
	unwrap<T>(type: T, key?: string) {}

	/**
	 * Retrieves an asset instance by its key.
	 * @template T The type of the asset to retrieve.
	 * @param {T | string} a The key of the asset.
	 * @returns {[T] | T | undefined} The asset instance or undefined if not found.
	 */
	get<T extends keyof A>(a: T): A[T];
	get<T extends Asset<any>>(a: string): T | undefined;
	get<T extends Asset<any>>(a: string): T | undefined {
		return this.assets[a] as T;
	}

	// biome-ignore lint/suspicious/noThenProperty: <explanation>
	then<TResult1 = A, TResult2 = never>(
		onfulfilled?: ((value: A) => TResult1 | PromiseLike<TResult1>) | null,
		onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
	): Promise<TResult1 | TResult2> {
		if (this.state === "idle") this.load();
		return this.promise.then(onfulfilled, onrejected);
	}

	catch<TResult = never>(
		onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
	): Promise<A | TResult> {
		return this.promise.catch(onrejected) as Promise<A | TResult>;
	}

	finally(onfinally?: (() => void) | null): Promise<A> {
		return this.promise.finally(onfinally) as Promise<A>;
	}

	get [Symbol.toStringTag]() {
		return "Promise";
	}
}
