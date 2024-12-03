import type { Actor } from "./Actor.ts";
import type { Behavior } from "./Behavior.ts";
import type { ThreeObject } from "../Actors/ThreeObject.ts";
import { s_IsBehavior, s_IsActor } from "../Internal/mod.ts";

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
	return s_IsBehavior in component;
}

/**
 * Returns true if the component is a ThreeObject.
 * @param component
 */
export function isThreeActor(component: any): component is ThreeObject
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
