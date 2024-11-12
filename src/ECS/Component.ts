import { Constructor } from "../Shared/Utilities.ts";

export class Component {}

export function getComponentType (component: Component)
{
	return component.constructor as Constructor<Component>
}
