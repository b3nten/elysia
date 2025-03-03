import {isWorker} from "./asserts.ts";

type SubscriptionCallback<T = any> = (msg: T, sender: WorkerProxy, event: MessageEvent) => void;
type SubscriptionCleanup = () => void;

type ProxyReceiver<T = any> = {
	$receive: () => Promise<{ data: T; event: MessageEvent; sender: WorkerProxy }>;
};

type ProxySubscriber<T = any> = {
	$subscribe: (callback: SubscriptionCallback<T>) => SubscriptionCleanup;
};

type ProxyNode<T = any> = {
	[key: string]: ProxyNode<any> | ((payload?: any) => void);
} & ProxyReceiver<T> & ProxySubscriber<T>;

// export type WorkerProxy<MessageMap = any> = {
// 	[K in keyof MessageMap]: MessageMap[K] extends object
// 		? WorkerProxy<MessageMap[K]>
// 		: MessageMap[K] extends any
// 			? ProxyNode<MessageMap[K]> & ((payload?: MessageMap[K]) => void)
// 			: ProxyNode<MessageMap[K]> & ((payload: MessageMap[K]) => void);
// } &  {
// 	[key: string]: WorkerProxy<any> & ProxyNode<any> & ((payload?: any) => void)
// };

export type WorkerProxy = {
	[k: string]: WorkerProxy
} & {
	[key: string]: ProxyNode
} & {
	[key: string]: (payload: any) => void
}

let createWorkerProxy = (worker: Worker, cache: Map<string, any>, lastProp: string): WorkerProxy => {
	return new Proxy(() => ({}), {
		get: (_, prop) => {
			if(prop === "$receive") {
				return () => new Promise((resolve, reject) => {
					let handler = (e: MessageEvent) => {
						if(e.data.type === `elysia:worker:${lastProp}`) {
							worker.removeEventListener("message", handler)
							resolve({
								data: e.data.payload,
								// @ts-ignore
								sender: createWorkerProxy(e.source as Worker, new Map, lastProp),
								event: e
							})
						}
					}
					worker.addEventListener("message", handler)
				})
			} else if (prop === "$subscribe") {
				// return listener for current path with cleanup function
				return (callback: SubscriptionCallback) => {
					let handler = (e: MessageEvent) => {
						if(e.data.type === `elysia:worker:${lastProp}`) {
							// @ts-ignore
							callback(e.data.payload, createWorkerProxy(e.source ?? worker, new Map, ""), e)
						}
					}
					worker.addEventListener("message", handler)
					return () => {
						worker.removeEventListener("message", handler)
					}
				}
			} else {
				// return new proxy for new path
				if(cache.has(lastProp + String(prop))) {
					return cache.get(lastProp + String(prop))
				} else {
					let w = createWorkerProxy(worker, cache, lastProp + String(prop))
					cache.set(lastProp + String(prop), w)
					return w
				}
			}
		},
		apply(_: any, __: any, argArray: any[]): any {
			worker.postMessage({
				type: `elysia:worker:${lastProp}`,
				payload: argArray[0],
				timestamp: performance.now(),
			})
		},
	}) as unknown as WorkerProxy
}

export let createWorker = <MessageMap = any>(
	w: Worker
): WorkerProxy => {
	let cache = new Map<string, any>()
	return createWorkerProxy(w, cache, "") as unknown as WorkerProxy
}

export let workerMain = createWorker(self as unknown as Worker)

