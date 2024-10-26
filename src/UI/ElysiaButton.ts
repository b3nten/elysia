import type { CSSResult } from "../../../../Library/Caches/deno/npm/registry.npmjs.org/@lit/reactive-element/2.0.4/development/reactive-element.d.ts";
import type { TemplateResult } from "lit";
import { css, defineComponent, ElysiaElement, html } from "./UI.ts";

export class ElysiaButton extends ElysiaElement {
	static override Tag = "elysia-button";

	static override styles: CSSResult = css`
        button {
            padding: 0.5em 1em;
            border: none;
            background-color: var(--elysia-color-purple);
            color: var(--elysia-color-cullen);
            border-radius: 1rem;
            transition: all 0.1s;
            user-select: none;
            font-family: var(--elysia-font-family);

            &:hover {
                cursor: pointer;
                background-color: oklch(from var(--elysia-color-purple) calc(l * .9) c h);
            }

            &:active {
                background-color: oklch(from var(--elysia-color-purple) calc(l * 1.1) c h);
            }
        }
	`

	public override onRender(): TemplateResult
	{
		return html`
			<button>
				<slot></slot>
			</button>`;
	}
}

defineComponent(ElysiaButton);
