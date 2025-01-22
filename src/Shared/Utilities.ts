export function toBoolean(val: any): boolean {
	return val ? val !== "false" : false;
}

export function toError(err: unknown): Error {
	if (err instanceof Error) {
		return err;
	}
	if (typeof err === "string") {
		return new Error(err);
	}
	return new Error(String(err));
}

/** does everything and nothing */
export function noop() {}

/**
 * Specifies the constructor of newable objects.
 */
export type Constructor<T, A extends any[] = any[]> = new (...args: A) => T;

/**
 * Specifies the instance type of a class, ignoring access modifiers on the constructor.
 * */
export type InstanceOfClass<T> = T extends { prototype: infer R } ? R : never;

/**
 * Union possibly empty type.
 */
export type Maybe<T> = T | null | undefined;

/**
 * Type that is optionally a result or a promise of a result.
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Type for objects that can be serialized to JSON or passed to `postMessage`.
 */
export type Serializable =
	| string
	| number
	| boolean
	| null
	| undefined
	| Serializable[]
	| { [key: string]: Serializable };

/**
 * Either executes a callback or returns a promise that resolves at least one paint later.
 * @param callback
 */
export const tick = <T>(
	callback?: T,
): T extends Function ? void : Promise<void> => {
	if (callback) {
		// @ts-ignore
		return requestAnimationFrame(() =>
			requestAnimationFrame(callback as any),
		) as unknown as void;
	}
	// @ts-ignore
	return new Promise((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(resolve)),
	) as unknown as Promise<void>;
};

type BoundDecorator = (
	value: Function,
	context: any,
) => void | ((...args: any) => any);

/**
 * Binds a method to the instance of the class it is defined in.
 */
export const bound: BoundDecorator = (recever, { name, addInitializer }) => {
	addInitializer(function (this: any) {
		this[name] = this[name].bind(this);
	});
};

const _lut = [
	"00",
	"01",
	"02",
	"03",
	"04",
	"05",
	"06",
	"07",
	"08",
	"09",
	"0a",
	"0b",
	"0c",
	"0d",
	"0e",
	"0f",
	"10",
	"11",
	"12",
	"13",
	"14",
	"15",
	"16",
	"17",
	"18",
	"19",
	"1a",
	"1b",
	"1c",
	"1d",
	"1e",
	"1f",
	"20",
	"21",
	"22",
	"23",
	"24",
	"25",
	"26",
	"27",
	"28",
	"29",
	"2a",
	"2b",
	"2c",
	"2d",
	"2e",
	"2f",
	"30",
	"31",
	"32",
	"33",
	"34",
	"35",
	"36",
	"37",
	"38",
	"39",
	"3a",
	"3b",
	"3c",
	"3d",
	"3e",
	"3f",
	"40",
	"41",
	"42",
	"43",
	"44",
	"45",
	"46",
	"47",
	"48",
	"49",
	"4a",
	"4b",
	"4c",
	"4d",
	"4e",
	"4f",
	"50",
	"51",
	"52",
	"53",
	"54",
	"55",
	"56",
	"57",
	"58",
	"59",
	"5a",
	"5b",
	"5c",
	"5d",
	"5e",
	"5f",
	"60",
	"61",
	"62",
	"63",
	"64",
	"65",
	"66",
	"67",
	"68",
	"69",
	"6a",
	"6b",
	"6c",
	"6d",
	"6e",
	"6f",
	"70",
	"71",
	"72",
	"73",
	"74",
	"75",
	"76",
	"77",
	"78",
	"79",
	"7a",
	"7b",
	"7c",
	"7d",
	"7e",
	"7f",
	"80",
	"81",
	"82",
	"83",
	"84",
	"85",
	"86",
	"87",
	"88",
	"89",
	"8a",
	"8b",
	"8c",
	"8d",
	"8e",
	"8f",
	"90",
	"91",
	"92",
	"93",
	"94",
	"95",
	"96",
	"97",
	"98",
	"99",
	"9a",
	"9b",
	"9c",
	"9d",
	"9e",
	"9f",
	"a0",
	"a1",
	"a2",
	"a3",
	"a4",
	"a5",
	"a6",
	"a7",
	"a8",
	"a9",
	"aa",
	"ab",
	"ac",
	"ad",
	"ae",
	"af",
	"b0",
	"b1",
	"b2",
	"b3",
	"b4",
	"b5",
	"b6",
	"b7",
	"b8",
	"b9",
	"ba",
	"bb",
	"bc",
	"bd",
	"be",
	"bf",
	"c0",
	"c1",
	"c2",
	"c3",
	"c4",
	"c5",
	"c6",
	"c7",
	"c8",
	"c9",
	"ca",
	"cb",
	"cc",
	"cd",
	"ce",
	"cf",
	"d0",
	"d1",
	"d2",
	"d3",
	"d4",
	"d5",
	"d6",
	"d7",
	"d8",
	"d9",
	"da",
	"db",
	"dc",
	"dd",
	"de",
	"df",
	"e0",
	"e1",
	"e2",
	"e3",
	"e4",
	"e5",
	"e6",
	"e7",
	"e8",
	"e9",
	"ea",
	"eb",
	"ec",
	"ed",
	"ee",
	"ef",
	"f0",
	"f1",
	"f2",
	"f3",
	"f4",
	"f5",
	"f6",
	"f7",
	"f8",
	"f9",
	"fa",
	"fb",
	"fc",
	"fd",
	"fe",
	"ff",
];

export function uuid(): string {
	const d0 = (Math.random() * 0xffffffff) | 0;
	const d1 = (Math.random() * 0xffffffff) | 0;
	const d2 = (Math.random() * 0xffffffff) | 0;
	const d3 = (Math.random() * 0xffffffff) | 0;
	const uuid =
		_lut[d0 & 0xff] +
		_lut[(d0 >> 8) & 0xff] +
		_lut[(d0 >> 16) & 0xff] +
		_lut[(d0 >> 24) & 0xff] +
		"-" +
		_lut[d1 & 0xff] +
		_lut[(d1 >> 8) & 0xff] +
		"-" +
		_lut[((d1 >> 16) & 0x0f) | 0x40] +
		_lut[(d1 >> 24) & 0xff] +
		"-" +
		_lut[(d2 & 0x3f) | 0x80] +
		_lut[(d2 >> 8) & 0xff] +
		"-" +
		_lut[(d2 >> 16) & 0xff] +
		_lut[(d2 >> 24) & 0xff] +
		_lut[d3 & 0xff] +
		_lut[(d3 >> 8) & 0xff] +
		_lut[(d3 >> 16) & 0xff] +
		_lut[(d3 >> 24) & 0xff];

	// .toLowerCase() here flattens concatenated strings to save heap memory space.
	return uuid.toLowerCase();
}
