export let isWorker = (): boolean => {
	return (
		// @ts-ignore - worker only
		typeof WorkerGlobalScope !== "undefined" &&
		// @ts-ignore - worker only
		self instanceof WorkerGlobalScope
	);
};

export function hasKeys<K extends string | number | symbol>(
	value: any,
	...keys: Array<K>
): value is { readonly [Key in K]: unknown } {
	return isObject(value) && keys.every((key) => key in value);
}

export function isObject(value: any): value is Object {
	return typeof value === "object" && value !== null;
}
