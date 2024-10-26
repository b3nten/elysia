import { lerp } from './Other.ts';
import { Vector2Like, Vector3Like, Vector4Like, VectorLike } from "./Vectors.ts";

/**
 * Improved lerp for smoothing that prevents overshoot and is frame rate independent.
 * - from https://theorangeduck.com/page/spring-roll-call
 * @param start - The value to start from. Can be a number or Vector.
 * @param end	- The value to end at. Can be a number or Vector.
 * @param delta - Frame delta time.
 * @param halflife - The half-life of decay (smoothing)
 * @returns If smoothing number, returns the smoothed number. If smoothing Vector, returns void.
 */
export function lerpSmooth(start: number, end: number, delta: number, halflife: number): number;
export function lerpSmooth(start: VectorLike, end: VectorLike, delta: number, halflife: number): void;
export function lerpSmooth(start: number | VectorLike, end: number | VectorLike, delta: number, halflife: number): number | void
{
	if(typeof start === 'number')
	{
		// @ts-ignore
		return lerp(start, end, -Math.expm1(-(0.69314718056 * delta) / (halflife + 1e-5)))
	} else {
		if(start.x)
		{
			// @ts-ignore
			start.x = lerp(start.x, end.x, -Math.expm1(-(0.69314718056 * delta) / (halflife + 1e-5)))
		}
		if(start.y)
		{
			// @ts-ignore
			start.y = lerp(start.y, end.y, -Math.expm1(-(0.69314718056 * delta) / (halflife + 1e-5)))
		}
		if(start.z)
		{
			// @ts-ignore
			start.z = lerp(start.z, end.z, -Math.expm1(-(0.69314718056 * delta) / (halflife + 1e-5)))
		}
		if(start.w)
		{// @ts-ignore
			start.w = lerp(start.w, end.w, -Math.expm1(-(0.69314718056 * delta) / (halflife + 1e-5)))
		}
	}
}