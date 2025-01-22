function hasObjectPrototype(o: unknown) {
	return Object.prototype.toString.call(o) === "[object Object]";
}

function isPlainObject(o: unknown) {
	if (!hasObjectPrototype(o)) return false;
	const ctor = o?.constructor;
	if (ctor === undefined) return true;
	const prot = ctor.prototype;
	if (!hasObjectPrototype(prot)) return false;
	if (!prot.hasOwnProperty("isPrototypeOf")) return false;
	return Object.getPrototypeOf(o) === Object.prototype;
}

/**
 * Hashes a key to a string, throwing an error if the key contains unserializable values.
 */
export function hashKey(key: any): string {
	return JSON.stringify(key, (_, val) =>
		isPlainObject(val)
			? Object.keys(val)
					.sort()
					.reduce((result, key) => {
						// @ts-ignore
						result[key] = val[key];
						return result;
					}, {})
			: val,
	);
}

/**
 * Hashes a key to a string, or returns the key if it cannot be hashed.
 */
export function safeHashKey(k: any): any {
	try {
		return hashKey(k);
	} catch {
		return k;
	}
}
