import { Future } from "../util/future.ts";

export abstract class Asset<T> implements Promise<T> {

	state: "idle" | "loading" | "loaded" | "error"

	get ready() {
		return this.state === "loaded"
	}

	data?: T;

	error?: Error;

	promise = new Future<T>;

	unwrap = (): T => {
		ELYSIA_DEV: {
			if(this.state !== "loaded") {
				throw Error(`unwrap() called on asset ${this.constructor.name} that is not loaded or has errored.`)
			}
			if(!this.data) {
				throw Error(`unwrap() called on asset ${this.constructor.name} that has no data.`)
			}
			return this.data
		}
		ELYSIA_PROD: {
			// biome-ignore lint/correctness/noUnreachable: ...
			// noinspection UnreachableCodeJS
			return this.data
		}
	}

	load = () => {
		if (["loaded", "loading", "error"].some(x => this.state === x)) {
			return this.promise;
		}

		this.state = "loading"

		try {
			this.loadImpl().then(x => {
				if(x instanceof Error) {
					this.error = x;
					this.state = "error";
					this.promise.reject(x);
				} else {
					this.data = x;
					this.state = "loaded";
					this.promise.resolve(x);
				}
			}).catch(e => {
				this.error = e;
				this.state = "error"
				this.promise.reject(e);
			})
		} catch (e) {
			this.error = e;
			this.state = "error"
			this.promise.reject(e);
		}

		return this.promise;
	}

	abstract loadImpl(): Promise<T | Error>


	// biome-ignore lint/suspicious/noThenProperty: <explanation>
	then<TResult1 = T, TResult2 = never>(
		onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
		onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
	): Promise<TResult1 | TResult2> {
		if(this.state === "idle") this.load();
		return this.promise.then(onfulfilled, onrejected);
	}

	catch<TResult = never>(
		onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
	): Promise<T | TResult> {
		return this.promise.catch(onrejected);
	}

	finally(onfinally?: (() => void) | null): Promise<T> {
		return this.promise.finally(onfinally);
	}

	get [Symbol.toStringTag]() {
		return "Promise";
	}
}
