export class Exception {
	constructor(public name: string) {}
}

export class DevException extends Exception {
	cause?: unknown;
	data?: unknown;
	constructor(message: string, options: { cause?: unknown; data?: unknown }) {
		super(message);
		this.cause = options.cause;
		this.data = options.data;
	}
}

export let throwDevException = (message: string, data?: unknown) => {
	throw new DevException(message, data);
};
