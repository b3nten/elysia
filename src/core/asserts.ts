export let isWorker = (): boolean => {
	return (
		// @ts-ignore - worker only
		typeof WorkerGlobalScope !== "undefined" &&
		// @ts-ignore - worker only
		self instanceof WorkerGlobalScope
	);
};
