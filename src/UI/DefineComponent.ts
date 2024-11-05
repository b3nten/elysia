import type { Constructor } from "../Core/Utilities.ts";
import { ElysiaImmediateElement } from "./ElysiaImmediateElement.ts";
import { ElysiaElement } from "./ElysiaElement.ts";

/**
 * Define a custom element component with a static `Tag` property.
 * @param component
 */
export default function defineComponent(component: Constructor<ElysiaElement | ElysiaImmediateElement> & { Tag: string })
{
	if(!component.Tag || component.Tag === "unknown-elysia-element")
	{
		throw new Error(`You must define a tag for ${component.name}!`)
	}
	if(!customElements.get(component.Tag))
	{
		customElements.define(component.Tag, component);
	}
}
