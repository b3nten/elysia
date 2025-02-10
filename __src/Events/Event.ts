export type EventType<T> = string & { __type: T };

export let createEvent = <T>(type: string): EventType<T> =>
	type as EventType<T>;

export let unwrapEvent = <T>(type: EventType<T>): string => type;
