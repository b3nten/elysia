export class SinglyLinkedListNode<T> {
	constructor(
		public data: T,
		public next: SinglyLinkedListNode<T> | null = null,
	) {}
}

export class SinglyLinkedList<T> {
	get length(): number {
		return this.#length;
	}

	get head(): SinglyLinkedListNode<T> | null {
		return this.#head;
	}

	get tail(): SinglyLinkedListNode<T> | null {
		return this.#tail;
	}

	/**
	 * Add a node to the end of the list
	 * @param data - The data to add to the list
	 */
	append(data: T) {
		const node = new SinglyLinkedListNode(data);

		if (!this.#head) {
			this.#head = node;
			this.#tail = node;
		} else {
			if (this.#tail) {
				this.#tail.next = node;
			}
			this.#tail = node;
		}

		this.#length++;
	}

	/**
	 * Add a node to the beginning of the list
	 * @param data - The data to add to the list
	 */
	prepend(data: T) {
		const node = new SinglyLinkedListNode(data);

		if (!this.#head) {
			this.#head = node;
			this.#tail = node;
		} else {
			node.next = this.#head;
			this.#head = node;
		}

		this.#length++;
	}

	/**
	 * Insert a node at a specific index
	 * @param index - The index to insert the node at
	 * @param data - The data to insert
	 */
	insert(index: number, data: T) {
		if (index < 0 || index > this.#length) {
			throw new Error("Index out of bounds");
		}

		if (index === 0) {
			this.prepend(data);
			return;
		}

		if (index === this.#length) {
			this.append(data);
			return;
		}

		const node = new SinglyLinkedListNode(data);
		let current = this.#head;
		let previous: SinglyLinkedListNode<T> | null = null;
		let i = 0;

		while (current && i < index) {
			previous = current;
			current = current.next;
			i++;
		}

		if (previous) {
			previous.next = node;
		}

		if (current) {
			node.next = current;
		}

		this.#length++;
	}

	/**
	 * Get the node at a specific index
	 * @param index - The index to get the node at
	 * @returns The node at the index
	 */
	getAt(index: number): SinglyLinkedListNode<T> | null {
		if (index < 0 || index >= this.#length) {
			throw new Error("Index out of bounds");
		}

		let current = this.#head;
		let i = 0;

		while (current && i < index) {
			current = current.next;
			i++;
		}

		return current;
	}

	/**
	 * Remove a node from a specific index
	 * @param {number} index - The index to remove the node from
	 */
	remove(index: number) {
		if (index < 0 || index >= this.#length) {
			throw new Error("Index out of bounds");
		}

		let current = this.#head;
		let previous: SinglyLinkedListNode<T> | null = null;
		let i = 0;

		while (current && i < index) {
			previous = current;
			current = current.next;
			i++;
		}

		if (previous) {
			previous.next = current?.next || null;
		} else {
			this.#head = current?.next || null;
		}

		if (current === this.#tail) {
			this.#tail = previous;
		}

		this.#length--;
	}

	/**
	 * Convert the list to an array
	 * @returns - The array representation of the list
	 */
	toArray(): T[] {
		const result: T[] = [];
		for (const node of this) {
			result.push(node.data);
		}
		return result;
	}

	/**
	 * Reverse the list
	 */
	reverse() {
		let current = this.#head;
		let previous = null;
		let next = null;

		while (current) {
			next = current.next;
			current.next = previous;
			previous = current;
			current = next;
		}

		this.#tail = this.#head;
		this.#head = previous;
	}

	/**
	 * Clear the list
	 */
	clear() {
		this.#head = null;
		this.#tail = null;
		this.#length = 0;
	}

	*[Symbol.iterator](): any {
		let current = this.#head;

		while (current) {
			yield current;
			current = current.next;
		}
	}

	#head: SinglyLinkedListNode<T> | null = null;

	#tail: SinglyLinkedListNode<T> | null = null;

	#length = 0;
}
