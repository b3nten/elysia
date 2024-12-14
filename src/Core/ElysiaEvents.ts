import { EventDispatcher } from "../Events/EventDispatcher.ts";
import { BaseEvent } from "../Events/Event.ts";
import type { Actor } from "./Actor.ts";
import type { Component } from "./Component.ts";

export const ElysiaEvents: EventDispatcher = new EventDispatcher;

export class TagAddedEvent extends BaseEvent<{ tag: any, target: Component }>{}
export class TagRemovedEvent extends BaseEvent<{ tag: any, target: Component }>{}

export class ComponentAddedEvent extends BaseEvent<{ parent: Actor, child: Component }>{}
export class ComponentRemovedEvent extends BaseEvent<{ parent: Actor, child: Component }>{}
