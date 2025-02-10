/**
 * A bidirectional communication channel between a worker and the main thread.
 * Public methods starting with "on" will be called when a message is received, with
 * the payload as the first argument.
 */
export class WorkerThread {
	/**
	 * Create a new worker thread.
	 * @param worker - The worker for the main thread to listen to. Leave undefined if running in worker.
	 */
	constructor(private worker?: Worker) {
		this.onMessage = this.onMessage.bind(this);
		if (worker) {
			worker.addEventListener("message", this.onMessage);
		} else {
			addEventListener("message", this.onMessage);
		}
	}

	/**
	 * Listen for messages from the worker or main thread.
	 */
	listen(): this {
		for (const [key, value] of Object.entries(this)) {
			if (key.startsWith("#")) continue;

			if (key.startsWith("on") && typeof value === "function") {
				this[key as keyof this] = value.bind(this);
			}
		}
		return this;
	}

	/**
	 * Send a message to the worker or main thread.
	 * @param key - The message key.
	 * @param payload - The data to send.
	 * @example
	 * ```ts
	 * workerThread.send("onHello", "world");
	 * ```
	 */
	send(key: string, payload: any) {
		if (this.worker) this.worker.postMessage({ $key: key, payload });
		else postMessage({ $key: key, payload });
	}

	private onMessage(event: MessageEvent) {
		if (typeof this[event.data?.$key as keyof this] === "function") {
			// @ts-ignore
			this[event.data.$key as keyof this](event.data.payload);
		}
	}
}
