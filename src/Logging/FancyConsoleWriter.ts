import { gradients, RGB } from "./Gradients.ts";
import { format, stringGradient } from "./Formatting.ts";
import { Writer } from "./Writer.ts";

export class FancyConsoleWriter implements Writer {

	formattedName: { content: string; styles: string[] };

	levels: Record<string, { content: string; styles: string[] }>;

	constructor(private name: string, color: [RGB, RGB]) {

		this.formattedName = stringGradient(`[ ${this.name} ]`, color);

		this.levels = {
			debug: stringGradient("DEBUG", gradients.gray, { size: 12 }),
			info: stringGradient("INFO", gradients.blue),
			success: stringGradient("SUCCESS", gradients.lime),
			warn: stringGradient("WARN", gradients.orange),
			error: stringGradient("ERROR", gradients.red, { bold: true }),
			critical: format("  CRITICAL  ", {
				background: [255, 0, 0],
				size: 20,
			}),
		};
	}

	debug(message: any[]): void
	{
		console.debug(
			`${this.formattedName.content} ${this.levels.debug.content}`,
			...this.formattedName.styles,
			...this.levels.debug.styles,
			...message,
		);
	}

	info(message: any[]): void
	{
		console.info(
			`${this.formattedName.content} ${this.levels.info.content}`,
			...this.formattedName.styles,
			...this.levels.info.styles,
			...message,
		);
	}

	success(message: any[]): void
	{
		console.log(
			`${this.formattedName.content} ${this.levels.success.content}`,
			...this.formattedName.styles,
			...this.levels.success.styles,
			...message,
		);
	}

	warn(message: any[]): void
	{
		console.warn(
			`${this.formattedName.content} ${this.levels.warn.content}`,
			...this.formattedName.styles,
			...this.levels.warn.styles,
			...message,
		);
	}

	error(message: any[]): void
	{
		console.error(
			`${this.formattedName.content} ${this.levels.error.content}`,
			...this.formattedName.styles,
			...this.levels.error.styles,
			...message,
		);
	}

	critical(message: any[]): void
	{
		console.error(
			`${this.formattedName.content} ${this.levels.critical.content}`,
			...this.formattedName.styles,
			...this.levels.critical.styles,
			...message,
		);
	}
}
