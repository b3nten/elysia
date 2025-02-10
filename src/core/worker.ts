/**
 * @internal
 * @description Register webworkers to listen for messages and dispatch custom workerMessage events.
 * @param w
 */
export let registerWorkers = (...w: Worker[]) => {
	for (let worker of w) {
		worker.addEventListener("message", (e) => {
			window.dispatchEvent(
				new CustomEvent("workerMessage", {
					detail: {
						source: worker,
						data: e.data,
					},
				}),
			);
		});
	}
};

export interface WorkerMessageEvent
	extends CustomEvent<{ source: Worker; data: any }> {}
