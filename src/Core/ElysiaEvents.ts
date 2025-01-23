import { EventDispatcher } from "../Events/EventDispatcher.ts";
import { createEvent } from "../Events/mod.ts";
import type { Actor } from "./Actor.ts";
import type { Component } from "./Component.ts";

export const ElysiaEvents: EventDispatcher = new EventDispatcher();

export const TagAddedEvent = createEvent<{ tag: any; target: Component }>(
	"elysia:TagAddedEvent",
);
export const TagRemovedEvent = createEvent<{
	tag: any;
	target: Component;
}>("elysia:TagRemovedEvent");
export const ComponentAddedEvent = createEvent<{
	parent: Actor;
	child: Component;
}>("elysia:ComponentAddedEvent");
export const ComponentRemovedEvent = createEvent<{
	parent: Actor;
	child: Component;
}>("elysia:ComponentRemovedEvent");
