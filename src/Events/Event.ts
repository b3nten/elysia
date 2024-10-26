export class ElysiaEvent<T extends unknown>
{
	public timestamp: number = performance.now();
	constructor(public readonly value: T) {}
}

export class BeginLoadEvent extends ElysiaEvent<void> {}
export class ProgressEvent extends ElysiaEvent<number> {}
export class ErrorEvent extends ElysiaEvent<Error> {}
export class LoadedEvent extends ElysiaEvent<void> {}
