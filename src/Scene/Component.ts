import { Actor } from "./Actor.ts";
import { Behavior, IsBehavior } from "./Behavior.ts";
import { ThreeActor } from "./ThreeActor.ts";
import { s_IsActor } from "./Internal.ts";

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
	return s_IsActor in component;
}

/**
 * Returns true if the component is a Behavior.
 * @param component
 */
export function isBehavior(component: any): component is Behavior
{
	return IsBehavior in component;
}

export function isThreeActor(component: any): component is ThreeActor
{
	return s_IsActor in component && "object3d" in component;
}

/**
 * Returns true if the component satisfies the Component interface.
 * @param component
 */
export function isComponent(component: any): component is Component
{
	return isActor(component) || isBehavior(component);
}
