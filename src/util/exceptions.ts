import { elysiaLogger } from "../core/log.ts";
import { Application, type IApplicationInternals } from "../core/application.ts";

export class Exception {
	constructor(public name: string) {}
}

export class DevException extends Exception {
	data?: unknown;
	message: string
	constructor(message: string, data?: unknown) {
		super("DevException");
		this.message = message;
		this.data = data;
	}
}

export let DEV_EXCEPTION = (message: string, data?: unknown) => {
	elysiaLogger.error(message, data);
	(<IApplicationInternals><unknown>Application.instance)._hasErrored = true;
};

export let EXCEPTION = (message: string, data?: unknown) => {
	elysiaLogger.error(message, data);
	throw new Exception(message);
}