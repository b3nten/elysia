import { hasKeys } from "../util/asserts.ts";
import * as Three from "three";
import type { Actor } from "../core/actor.ts";

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
	return hasKeys(obj, "x", "y", "z", "w");
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

export class Vector3 extends Three.Vector3 implements Vector3Like {
	protected _x: number;
	protected _y: number;
	protected _z: number;

	constructor(x?: number, y?: number, z?: number) {
		super(x, y, z);

		this._x = x ?? 0;
		this._y = y ?? 0;
		this._z = z ?? 0;

		Object.defineProperties(this, {
			x: {
				get() {
					return this._x;
				},
				set(value) {
					this._x = value;
					this.onChange?.();
				},
			},
			y: {
				get() {
					return this._y;
				},
				set(value) {
					this._y = value;
					this.onChange?.();
				},
			},
			z: {
				get() {
					return this._z;
				},
				set(value) {
					this._z = value;
					this.onChange?.();
				},
			},
		});
	}

	onChange?(): void;
}

/** @internal patches Three.Quaternion to flag parent actor as dirty */
export class Quaternion extends Three.Quaternion implements QuaternionLike {
	actor?: Actor;
	getEuler(order: Three.EulerOrder = "XYZ") {
		return this._euler.setFromQuaternion(this, order);
	}
	protected _euler = new Three.Euler();
	// @ts-ignore
	override _onChangeCallback() {
		this.onChange?.();
	}
	onChange?(): void;
}

export class Matrix4 extends Three.Matrix4 {}

export class BoundingBox extends Three.Box3 {
	reset() {
		this.makeEmpty();
	}
}

export class BoundingSphere extends Three.Sphere {
	reset() {
		this.makeEmpty();
	}
}
