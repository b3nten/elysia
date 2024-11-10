import { Constructor } from "../Core/Utilities.ts";

export class Component {}

export function getComponentType (component: Component)
{
	return component.constructor as Constructor<Component>
}
