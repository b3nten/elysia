import { Future } from "../Containers/Future.ts";
import { ElysiaEventDispatcher } from "../Events/EventDispatcher.ts";
import { Maybe, MaybePromise } from "../Core/Utilities.ts";
import { clamp } from "../Math/Other.ts";
import { BeginLoadEvent, LoadedEvent, ErrorEvent, ProgressEvent } from "../Events/Event.ts";

export abstract class Asset<T> {

	abstract loader(): MaybePromise<Maybe<T>>;

	get data(): Maybe<T> { if(!this.#started) this.load(); return this.#data; }
	get error(): Maybe<Error> { return this.#error; }
	get loaded(): boolean { return this.#loaded; }
	get loading(): boolean { return this.#loading; }
	get progress(): number { return this.#progress; }

	constructor()
	{
		this.#eventDispatcher = new ElysiaEventDispatcher;
		this.addEventListener = this.#eventDispatcher.addEventListener.bind(this.#eventDispatcher);
		this.removeEventListener = this.#eventDispatcher.removeEventListener.bind(this.#eventDispatcher);

		this.updateProgress = this.updateProgress.bind(this);
		this.load = this.load.bind(this);
		this.fetch = this.fetch.bind(this);
	}

	load(): Promise<Maybe<T>>
	{
		if(!this.#started)
		{
			this.loadImpl();
		}
		return this.#future
	}

	private async loadImpl()
	{
		this.#eventDispatcher.dispatchEvent(new BeginLoadEvent);
		this.#started = true;
		this.#loading = true;
		this.#progress = 0;
		this.#error = null;
		try {
			const d = await this.loader();
			this.#data = d;
			this.#eventDispatcher.dispatchEvent(new LoadedEvent);
			this.#future.resolve(d);
		}
		catch(e)
		{
			this.#error = e instanceof Error ? e : new Error(String(e));
			this.#loaded = true;
			this.#loading = false;
			this.#eventDispatcher.dispatchEvent(new ErrorEvent(this.error!));
			this.#future.reject(e);
		}
		finally
		{
			this.#loading = false;
			this.#loaded = true;
			this.#progress = 1;
		}
	}

	addEventListener: ElysiaEventDispatcher["addEventListener"];
	removeEventListener: ElysiaEventDispatcher["removeEventListener"];

	protected async fetch(url: string, options?: RequestInit & { onProgress?: (progress: number) => void }): Promise<Response>
	{
		const response = await fetch(url, options);

		const reader = response.body?.getReader();

		if (!reader) return response;

		const contentLength = response.headers.get("Content-Length");

		const total = contentLength
			? Number.parseInt(contentLength, 10)
			: undefined;

		let received = 0;

		const updateProgress =
			options?.onProgress ?? this.updateProgress;

		const stream = new ReadableStream({
			start(controller) {
				const pump = () => {
					reader.read().then(({ done, value }) => {
						if (done)
						{
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

	protected updateProgress(progress: number)
	{
		this.#progress = clamp(progress, 0, 1);
		this.#eventDispatcher.dispatchEvent(new ProgressEvent(this.#progress));
	}

	#eventDispatcher: ElysiaEventDispatcher;
	#future = new Future<Maybe<T>>(() => {});
	#loading = false;
	#loaded = false;
	#started = false;
	#progress = 0;
	#data: Maybe<T>;
	#error: Maybe<Error>;
}
