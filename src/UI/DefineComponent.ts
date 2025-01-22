import "./SSRPolyfill.ts";
import type { Constructor } from "../Shared/Utilities.ts";
import type { ElysiaElement } from "./ElysiaElement.ts";

/**
 * Define a custom element component with a static `Tag` property.
 * @param component
 */
export default function defineComponent(
	component: Constructor<ElysiaElement> & { Tag: string },
) {
	if (!component.Tag || component.Tag === "unknown-elysia-element") {
		throw new Error(`You must define a tag for ${component.name}!`);
	}
	if (!customElements.get(component.Tag)) {
		customElements.define(component.Tag, component);
	}
}
