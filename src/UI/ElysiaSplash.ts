import { css, defineComponent, ElysiaElement, html } from "./ElysiaElement.ts";
import logo_transparent from "../../assets/logo_transparent.ts";

export class ElysiaSplash extends ElysiaElement
{
	protected override onRender() {
		return html`
			<div>
				<img src="${logo_transparent}" />
				<div>ELYSIA ENGINE</div>
			</div>
		`
	}
}

defineComponent(ElysiaSplash)
