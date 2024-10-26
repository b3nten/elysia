export function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }

export function remap(
	value: number,
	fromMin: number,
	fromMax: number,
	toMin: number,
	toMax: number
): number
{
	return toMin + (value - fromMin) * (toMax - toMin) / (fromMax - fromMin);
}

/**
 * Linearly interpolates between two numbers.
 */
export function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

/**
 * Linearly interpolates between two vectors.
 */
export function slerp(a: number, b: number, t: number): number
{
	return a + (b - a) * (1 - Math.cos(t * Math.PI)) / 2;
}