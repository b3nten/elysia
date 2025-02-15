import {hasKeys} from "../core/asserts.ts";

/**
 * A type that represents a 2D, 3D, or 4D vector.
 */
export type VectorLike = { x: number; y: number; z?: number; w?: number };
export type Vector2Like = { x: number; y: number };
export type Vector3Like = { x: number; y: number; z: number };
export type Vector4Like = { x: number; y: number; z: number; w: number };

/**
 * A type that represents a quaternion.
 */
export type QuaternionLike = { x: number; y: number; z: number; w: number };

/**
 * A type that represents Euler angles.
 */
export type EulerLike = {
	x: number;
	y: number;
	z: number;
	order?: string;
};

/**
 * @description Typeguard for Vector2Like.
 * @param obj
 */
export function isVector2Like(obj: unknown): obj is Vector2Like {
	return hasKeys(obj, "x", "y");
}

/**
 * @description Typeguard for Vector3Like.
 * @param obj
 */
export function isVector3Like(obj: any): obj is Vector3Like {
	return hasKeys(obj, "x", "y", "z");
}

/**
 * @description Typeguard for Vector4Like.
 * @param obj
 */
export function isVector4Like(obj: any): obj is Vector4Like {
	return hasKeys(obj, "x", "y", "z", "w")
}

/**
 * @description Typeguard for QuaternionLike.
 * @param obj
 */
export function isQuaternionLike(obj: any): obj is QuaternionLike {
	return hasKeys(obj, "x", "y", "z", "w");
}

/**
 * @description Typeguard for EulerLike.
 * @param obj
 */
export function isEulerLike(obj: any): obj is EulerLike {
	return hasKeys(obj, "x", "y", "z");
}
