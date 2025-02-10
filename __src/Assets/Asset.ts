/**
 * @module Asset
 * @description Provides a base class for managing asynchronous asset loading with progress tracking and event dispatching.
 *
 * @example
 * ```ts
 * class ImageAsset extends Asset<HTMLImageElement> {
 *   constructor(private url: string) {
 *     super();
 *   }
 *
 *   loader() {
 *     return new Promise<HTMLImageElement>((resolve, reject) => {
 *       const img = new Image();
 *       img.onload = () => resolve(img);
 *       img.onerror = reject;
 *       img.src = this.url;
 *     });
 *   }
 * }
 *
 * const asset = new ImageAsset("https://example.com/image.png");
 * asset.addEventListener("progress", (e) => console.log(`Loading progress: ${e.progress * 100}%`));
 * asset.load().then(() => console.log("Image loaded!"));
 * ```
 */

import { Future } from "../Containers/Future.ts";
import { EventDispatcher } from "../Events/EventDispatcher.ts";
import type { Maybe, MaybePromise } from "../Shared/Utilities.ts";
import { clamp } from "../Math/Other.ts";
import {
	BeginLoadEvent,
	LoadedEvent,
	ErrorEvent,
	ProgressEvent,
} from "./Events.ts";

/**
 * Abstract base class for asset loading.
 * @template T The type of data this asset will load.
 */

export abstract class Asset<T> {
	/**
	 * Abstract method to be implemented by subclasses. Defines how to load the asset.
	 * @returns {MaybePromise<Maybe<T>>} A promise that resolves with the loaded asset data.
	 */
	abstract loader(): MaybePromise<Maybe<T>>;

	get data(): Maybe<T> {
		if (!this.#started) this.load();
		return this.#data;
	}
	get error(): Maybe<Error> {
		return this.#error;
	}
	get loaded(): boolean {
		return this.#loaded;
	}
	get loading(): boolean {
		return this.#loading;
	}
	get progress(): number {
		return this.#progress;
	}

	constructor() {
		this.#eventDispatcher = new EventDispatcher();
		this.addEventListener = this.#eventDispatcher.addEventListener.bind(
			this.#eventDispatcher,
		);
		this.removeEventListener = this.#eventDispatcher.removeEventListener.bind(
			this.#eventDispatcher,
		);

		this.updateProgress = this.updateProgress.bind(this);
		this.load = this.load.bind(this);
		this.fetch = this.fetch.bind(this);
	}

	/**
	 * Initiates the asset loading process.
	 * @returns {Promise<Maybe<T>>} A promise that resolves with the loaded asset data.
	 */
	load(): Promise<Maybe<T>> {
		if (!this.#started) {
			this.loadImpl();
		}
		return this.#future;
	}

	addEventListener: EventDispatcher["addEventListener"];
	removeEventListener: EventDispatcher["removeEventListener"];

	/**
	 * Fetches a resource with progress tracking.
	 * @param {string} url - The URL of the resource to fetch.
	 * @param {Object} [options] - Fetch options and callbacks.
	 * @param {Function} [options.onProgress] - Callback for progress updates.
	 * @returns {Promise<Response>} A promise that resolves with the fetched response.
	 */
	protected async fetch(
		url: string,
		options?: RequestInit & { onProgress?: (progress: number) => void },
	): Promise<Response> {
		const response = await fetch(url, options);

		const reader = response.body?.getReader();

		if (!reader) return response;

		const contentLength = response.headers.get("Content-Length");

		const total = contentLength
			? Number.parseInt(contentLength, 10)
			: undefined;

		let received = 0;

		const updateProgress = options?.onProgress ?? this.updateProgress;

		const stream = new ReadableStream({
			start(controller) {
				const pump = () => {
					reader.read().then(({ done, value }) => {
						if (done) {
							controller.close();
							updateProgress(1);
							return;
						}
						received += value.byteLength;
						typeof total === "number" && updateProgress(received / total);
						controller.enqueue(value);
						pump();
					});
				};
				pump();
			},
		});

		return new Response(stream, {
			headers: response.headers,
			status: response.status,
		});
	}

	/**
	 * Updates the loading progress and dispatches a ProgressEvent.
	 * @param {number} progress - The current progress value between 0 and 1.
	 */
	protected updateProgress(progress: number) {
		this.#progress = clamp(progress, 0, 1);
		this.#eventDispatcher.dispatchEvent(ProgressEvent, this.#progress);
	}

	private async loadImpl() {
		this.#eventDispatcher.dispatchEvent(BeginLoadEvent, undefined);
		this.#started = true;
		this.#loading = true;
		this.#progress = 0;
		this.#error = null;
		try {
			const d = await this.loader();
			this.#data = d;
			this.#eventDispatcher.dispatchEvent(LoadedEvent, this);
			this.#future.resolve(d);
		} catch (e) {
			this.#error = e instanceof Error ? e : new Error(String(e));
			this.#loaded = true;
			this.#loading = false;
			this.#eventDispatcher.dispatchEvent(ErrorEvent, this.error);
			this.#future.reject(e);
		} finally {
			this.#loading = false;
			this.#loaded = true;
			this.#progress = 1;
		}
	}

	#eventDispatcher: EventDispatcher;
	#future = new Future<Maybe<T>>(() => {});
	#loading = false;
	#loaded = false;
	#started = false;
	#progress = 0;
	#data: Maybe<T>;
	#error: Maybe<Error>;
}
