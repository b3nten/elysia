import { Actor, IsActor } from "./Actor.ts";
import { Behavior, IsBehavior } from "./Behavior.ts";

/**
 * A Component is an Actor or Behavior that satisfies the ActorLifecycle interface.
 */
export type Component = Actor | Behavior;

/**
 * Returns true if the component is an Actor.
 * @param component
 */
export function isActor(component: any): component is Actor
{
	return IsActor in component;
}

/**
 * Returns true if the component is a Behavior.
 * @param component
 */
export function isBehavior(component: any): component is Behavior
{
	return IsBehavior in component;
}

/**
 * Returns true if the component satisfies the Component interface.
 * @param component
 */
export function isComponent(component: any): component is Component
{
	return isActor(component) || isBehavior(component);
}
