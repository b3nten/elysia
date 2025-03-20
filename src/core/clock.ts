export class Clock {
	public get elapsed(): number {
		return this.#elapsed;
	}

	public get delta(): number {
		return this.#delta;
	}

	public get rawDelta(): number {
		return this.#rawDelta;
	}

	public capture(): void {
		if (!this.#started) {
			this.#started = true;
			this.#now = performance.now();
			this.#last = this.#now;
			return;
		}
		this.#now = performance.now();
		this.#rawDelta = this.#now - this.#last;
		this.#delta = Math.max(0.00001, Math.min((this.#now - this.#last) / 1000, 0.06));
		this.#elapsed += this.#delta;
		this.#last = this.#now;
	}

	#started = false;
	#now = 0;
	#last = 0;
	#elapsed = 0;
	#delta = 0.016;
	#rawDelta = 0;
}
