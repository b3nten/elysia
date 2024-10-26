import { ElysiaEventDispatcher } from "../Events/EventDispatcher.ts";
import { ElysiaEvent } from "../Events/Event.ts";
import { Actor } from "../Scene/Actor.ts";
import { Component } from "../Scene/Component.ts";

export const ElysiaEvents: ElysiaEventDispatcher = new ElysiaEventDispatcher;

export class TagAddedEvent extends ElysiaEvent<{ tag: any, target: Component }>{}
export class TagRemovedEvent extends ElysiaEvent<{ tag: any, target: Component }>{}

export class ComponentAddedEvent extends ElysiaEvent<{ parent: Actor, child: Component }>{}
export class ComponentRemovedEvent extends ElysiaEvent<{ parent: Actor, child: Component }>{}
