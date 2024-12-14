// @ts-types="npm:@types/three@^0.169"
import type {
	Camera,
	DirectionalLight,
	Euler,
	Group,
	Light,
	Material,
	Mesh,
	Object3D,
	OrthographicCamera,
	PerspectiveCamera,
	PointLight,
	Quaternion,
	RenderItem,
	Scene,
	SkinnedMesh,
	SpotLight,
	Texture,
	Vector2,
	Vector3,
} from "three";
import { env } from "./Platform.ts";
import { toBoolean } from "./Utilities.ts";
import process from "node:process";

export class AssertionError extends Error
{
	constructor(message: string)
	{
		super(message);
		this.name = "AssertionError";
		this.stack = this.stack
			?.split("\n")
			.filter((line) => !line.includes("at ASSERT"))
			.join("\n");
	}
}

export class DebugAssertionError extends AssertionError
{
	constructor(message: string)
	{
		super(message);
		this.name = "DebugAssertionError";
		this.stack = this.stack
			?.split("\n")
			.filter((line) => !line.includes("at DEBUG_ASSERT"))
			.join("\n");
	}
}

export function ASSERT<T>(condition: T, message?: string | Function | Error): asserts condition
{
	if (!ASSERT.enabled) return;
	if (!condition)
	{
		if (typeof message === "string")
		{
			throw new AssertionError(message);
		}
		else if (typeof message === "function")
		{
			message();
		}
		else if (message instanceof Error)
		{
			throw message;
		}
		else
		{
			throw new AssertionError("Assertion failed");
		}
	}
}

ASSERT.enabled = true;

export function DEBUG_ASSERT(condition: any, message: string | Function | Error): asserts condition
{
	if (!DEBUG_ASSERT.enabled || isDev()) return;
	if (!condition)
	{
		if (typeof message === "string")
		{
			throw new DebugAssertionError(message);
		}
		else if (typeof message === "function")
		{
			message();
		}
		else
		{
			throw message;
		}
	}
}

DEBUG_ASSERT.enabled = true;

export function isBoolean(value: any): value is boolean { return typeof value === "boolean"; }

export function isTrue(value: any): value is true { return value === true; }

export function isFalse(value: any): value is false { return value === false; }

export function isTruthy<T>(value: T): value is NonNullable<T> { return !!value; }

export function isFalsy(value: any): value is false | 0 | "" | null | undefined | void { return !value; }

export function isNull(value: any): value is null { return value === null; }

export function isUndefined(value: any): value is undefined { return value === undefined; }

export function isNullish(value: any): value is null | undefined { return isNull(value) || isUndefined(value); }

export function isString(value: any): value is string { return typeof value === "string"; }

export function isNumber(value: any): value is number { return typeof value === "number"; }

export function isInteger(value: any): value is number { return Number.isInteger(value); }

export function isFloat(value: any): value is number { return Number.isFinite(value) && !Number.isInteger(value); }

export function isBigInt(value: any): value is bigint { return typeof value === "bigint"; }

export function isSymbol(value: any): value is symbol { return typeof value === "symbol"; }

export function isFunction(value: any): value is Function { return typeof value === "function"; }

export function isDestroyable(value: any): value is { destructor(): void } { return value && isObject(value) && isFunction(value.destructor); }

export function isObject(value: any): value is Object { return typeof value === "object" && value !== null; }

export function hasKeys<K extends string | number | symbol>(value: any, ...keys: Array<K>): value is { readonly [Key in K]: unknown } { return isObject(value) && keys.every((key) => key in value); }

export function isArray(value: any): value is Array<any> {
	return Array.isArray(value);
}

export function isPropertyKey(value: any): value is PropertyKey { return isString(value) || isNumber(value) || isSymbol(value); }

export function arrayContains<T>( value: any, type: (value: any) => value is T): value is Array<T>
{
	if (!isArray(value)) return false;
	for (const item of value)
	{
		if (!type(item)) return false;
	}
	return true;
}

export function isDate(value: any): value is Date { return value instanceof Date; }

export function isError(value: any): value is Error { return value instanceof Error; }

export function isRegExp(value: any): value is RegExp { return value instanceof RegExp; }

export function isPromise(value: any): value is Promise<unknown> { return value instanceof Promise; }

export function isBrowser(): boolean { return typeof window !== "undefined" && typeof document !== "undefined"; }

export function isNode(): boolean
{
	// @ts-ignore - Node specific
	return typeof process !== "undefined" && process.versions != null && process.versions.node != null;
}

export function SET_ELYSIA_DEV(value: boolean): void
{
	// @ts-ignore - global
	globalThis.ELYSIA_DEV = value;
}
// @ts-ignore - global
globalThis.ELYSIA_DEV = undefined;

export function isDev(): boolean
{
	// @ts-ignore - lol
	return globalThis.ELYSIA_DEV;
}

// @ts-ignore - Node specific
export function hasTTY(): boolean { return toBoolean(globalThis.process?.stdout && globalThis.process?.stdout.isTTY); }

export function isCI(): boolean { return toBoolean(env().CI); }

//three

export function isObject3D(obj: any): obj is Object3D { return "isObject3D" in obj; }

export function isScene(obj: any): obj is Scene { return "isScene" in obj; }

export function isGroup(obj: any): obj is Group { return "isGroup" in obj; }

export function isCamera(obj: any): obj is Camera { return "isCamera" in obj; }

export function isPerspectiveCamera(obj: any): obj is PerspectiveCamera { return "isPerspectiveCamera" in obj; }

export function isOrthographicCamera(obj: any): obj is OrthographicCamera { return "isOrthographicCamera" in obj; }

export function isVector2Like(obj: any): obj is Vector2 | { x: number; y: number } { return "x" in obj && "y" in obj; }

export function isVector2(obj: any): obj is Vector2 { return "isVector2" in obj; }

export function isVector3Like(obj: any): obj is Vector3 | { x: number; y: number; z: number } { return "x" in obj && "y" in obj && "z" in obj; }

export function isVector3(obj: any): obj is Vector3 { return "isVector3" in obj; }

export function isQuaternionLike(obj: any,): obj is Quaternion | { x: number; y: number; z: number; w: number } { return "x" in obj && "y" in obj && "z" in obj && "w" in obj; }

export function isQuaternion(obj: any): obj is Quaternion { return "isQuaternion" in obj; }

export function isEulerLike(obj: any): obj is Euler | { x: number; y: number; z: number } { return "x" in obj && "y" in obj && "z" in obj; }

export function isEuler(obj: any): obj is Euler { return "isEuler" in obj; }

export function isLight(obj: any): obj is Light { return "isLight" in obj; }

export function isPointLight(obj: any): obj is PointLight { return "isPointLight" in obj; }

export function isSpotLight(obj: any): obj is SpotLight { return "isSpotLight" in obj; }

export function isDirectionalLight(obj: any): obj is DirectionalLight { return "isDirectionalLight" in obj; }

export function isMesh(obj: any): obj is Mesh { return "isMesh" in obj; }

export function isSkinnedMesh(obj: any): obj is SkinnedMesh { return "isSkinnedMesh" in obj; }

export function isMaterial(obj: any): obj is Material { return "isMaterial" in obj; }

export function isTexture(obj: any): obj is Texture { return "isTexture" in obj; }

export function isRenderItem(obj: any): obj is RenderItem { return "isRenderItem" in obj; }
