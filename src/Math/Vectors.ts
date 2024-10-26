import { hasKeys, isObject, isTruthy } from "../Core/Asserts.ts";

export type VectorLike = { x: number, y: number, z?: number, w?: number }
export type Vector2Like = { x: number, y: number };
export type Vector3Like = { x: number, y: number, z: number };
export type Vector4Like = { x: number, y: number, z: number, w: number };
export type QuaternionLike = { x: number, y: number, z: number, w: number };

export function isVectorLike(obj: unknown): obj is VectorLike { return isObject(obj) }

export function isVector2Like(obj: unknown): obj is Vector2Like { return hasKeys(obj, "x", "y"); }

export function isVector3Like(obj: any): obj is Vector3Like { return hasKeys(obj, "x", "y", "z"); }

export function isVector4Like(obj: any): obj is Vector4Like { return hasKeys(obj, "x", "y", "z", "w"); }
