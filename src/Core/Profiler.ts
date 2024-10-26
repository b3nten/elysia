export interface IProfilerHandler
{
	/**
	 * The threshold for which onDown or onUp will be called based on average frame deltas.
	 * onDown and onUp will be called each frame so it's up to the handler to manage the amount of
	 * times it should be called.
	 */
	threshold: number;

	/**
	 * Called when the average frame delta is greater than the threshold.
	 */
	onDown(): void;

	/**
	 * Called when the average frame delta is less than the threshold.
	 */
	onUp(): void;
}

/**
 * @internal
 * Used by Application to monitor the average frame delta and
 * call a handler when the average frame delta is greater or less than a threshold.
 */
export class Profiler
{

	deltas: number[] = [];

	average = 0;

	constructor(private handler?: IProfilerHandler) {}

	onUpdate(delta: number)
	{
		this.deltas.push(delta);
		if (this.deltas.length > 30) { this.deltas.shift(); }
		else if (this.deltas.length < 30) return;

		this.average = average(this.deltas);
		if (this.handler)
		{
			if (this.average > this.handler.threshold)
			{
				this.handler.onDown();
			}
			else
			{
				this.handler.onUp();
			}
		}
	}
}

const average = (arr: number[]) =>
{
	let sum = 0;
	for (let i = 0; i < arr.length; i++) { sum += arr[i]; }
	return sum / arr.length;
}