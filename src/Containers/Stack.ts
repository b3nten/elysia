/**
 * A stack data structure.
 */
export class Stack<T>
{
	/**
	 * The number of elements in the stack.
	 */
	get size(): number { return this.#elements.length; }

	/**
	 * Pushes elements onto the stack.
	 * @param elements The elements to push onto the stack.
	 */
	push(...elements: T[]): void { this.#elements.push(...elements); }

	/**
	 * Pops elements off the stack.
	 * @returns The element that was popped off the stack.
	 */
	pop(): T | undefined { return this.#elements.pop(); }

	/**
	 * Peeks at the top element of the stack.
	 * @returns The top element of the stack.
	 */
	peek(): T | undefined { return this.#elements[this.#elements.length - 1]; }

	/**
	 * Checks if the stack is empty.
	 * @returns True if the stack is empty, otherwise false.
	 */
	isEmpty(): boolean { return this.#elements.length === 0; }

	/**
	 * Clears the stack.
	 */
	clear() { this.#elements.length = 0; }

	/**
	 * Iterates over the stack, popping elements off the stack.
	 * @returns An iterator over the stack.
	 */
	*iterate(): Generator<T | undefined, void, unknown> { while(this.#elements.length) yield this.#elements.pop(); }

	/**
	 * Iterates over the stack, not removing elements.
	 * @returns An iterator over the stack.
	 */
	*peekIterate(): Generator<T, void, unknown> { for(const element of this.#elements) yield element; }

	#elements: T[] = [];
}
