/**
 * A custom implementation of the Promise class that allows for synchronous access to the resolved value.
 * This is useful for cases where a promise is resolved synchronously, but the value is needed immediately.
 * It can also be resolved or rejected externally.
 * @template T The type of the resolved value.
 */
export class Future<T> implements Promise<T>
{
	/**
	 * Resolve the promise with the given value.
	 */
	public resolve!: (value: T | PromiseLike<T>) => void;
	/**
	 * Reject the promise with the given reason.
	 */
	public reject!: (reason?: any) => void;
	/**
	 * Get the current state of the promise.
	 */
	get state(): 'pending' | 'fulfilled' | 'rejected' {
		return this.#state;
	}
	/**
	 * Get the value of the promise synchronously, undefined if pending.
	 */
	get value(): T | undefined {
		return this.#syncValue;
	}

	[Symbol.toStringTag] = 'Promise';

	constructor(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void)
	{
		this.#promise = new Promise<T>((res, rej) => {
			this.resolve = async (value: T | PromiseLike<T>) => {
				await this.#resolveValue(value);
				res(value);
			};
			this.reject = (reason?: any) => {
				this.#state = 'rejected';
				rej(reason);
			};
			executor(this.resolve, this.reject);
		});
	}

	then<TResult1 = T, TResult2 = never>(
		onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
		onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
	): Promise<TResult1 | TResult2>
	{
		return this.#promise.then(onfulfilled, onrejected);
	}

	catch<TResult = never>(
		onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
	): Promise<T | TResult>
	{
		return this.#promise.catch(onrejected);
	}

	finally(onfinally?: (() => void) | undefined | null): Promise<T>
	{
		return this.#promise.finally(onfinally);
	}

	#promise: Promise<T>;

	#syncValue?: T;

	#state: 'pending' | 'fulfilled' | 'rejected' = 'pending';

	async #resolveValue(value: T | PromiseLike<T>): Promise<void>
	{
		try
		{
			this.#syncValue = await value;
			this.#state = 'fulfilled';
		}
		catch (error) { this.#state = 'rejected'; }
	}
}
