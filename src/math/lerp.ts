import type { VectorLike } from "./vectors.ts";

/**
 * Linearly interpolates between two numbers.
 */
export let lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Smoothly interpolates between two numbers.
 */
export let slerp = (a: number, b: number, t: number): number =>
	a + ((b - a) * (1 - Math.cos(t * Math.PI))) / 2;

/**
 * Improved lerp for smoothing that prevents overshoot and is frame rate independent.
 * - from https://theorangeduck.com/page/spring-roll-call
 * @param start - The value to start from. Can be a number or Vector.
 * @param end	- The value to end at. Can be a number or Vector.
 * @param delta - Frame delta time.
 * @param halflife - The half-life of decay (smoothing)
 * @returns If smoothing number, returns the smoothed number. If smoothing Vector, returns void.
 */
export let lerpSmooth = (
	start: number | VectorLike,
	end: number | VectorLike,
	delta: number,
	halflife: number,
): number => {
	if (typeof start === "number") {
		return lerp(
			start,
			end as number,
			-Math.expm1(-(Math.LN2 * delta) / (halflife + 1e-5)),
		);
	}

	if (start.x) {
		start.x = lerp(
			start.x,
			(end as VectorLike).x,
			-Math.expm1(-(Math.LN2 * delta) / (halflife + 1e-5)),
		);
	}

	if (start.y) {
		start.y = lerp(
			start.y,
			(end as VectorLike).y,
			-Math.expm1(-(Math.LN2 * delta) / (halflife + 1e-5)),
		);
	}

	if (start.z) {
		start.z = lerp(
			start.z,
			(end as VectorLike).z,
			-Math.expm1(-(Math.LN2 * delta) / (halflife + 1e-5)),
		);
	}

	if (start.w) {
		start.w = lerp(
			start.w,
			(end as VectorLike).w,
			-Math.expm1(-(Math.LN2 * delta) / (halflife + 1e-5)),
		);
	}
};
