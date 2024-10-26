import { Writer } from "./Writer.ts";

export class BasicConsoleWriter implements Writer
{
	constructor(private name: string) {}

	debug(message: any[]): void { console.debug(`${performance.now()} [${this.name}] DEBUG`, ...message); }

	info(message: any[]): void { console.info(`${performance.now()} [${this.name}] INFO`, ...message); }

	success(message: any[]): void { console.log(`${performance.now()} [${this.name}] SUCCESS`, ...message); }

	warn(message: any[]): void { console.warn(`${performance.now()} [${this.name}] WARN`, ...message); }

	error(message: any[]): void { console.error(`${performance.now()} [${this.name}] ERROR`, ...message); }

	critical(message: any[]): void { console.error(`${performance.now()} [${this.name}] CRITICAL`, ...message); }
}
