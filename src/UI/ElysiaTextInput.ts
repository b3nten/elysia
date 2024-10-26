import type { CSSResult } from "../../../../Library/Caches/deno/npm/registry.npmjs.org/@lit/reactive-element/2.0.4/development/css-tag.d.ts";
import type { TemplateResult } from "lit";
import { attribute, css, defineComponent, ElysiaElement, html } from "./UI.ts";

export class ElysiaTextInput extends ElysiaElement {
	static override Tag = "elysia-text-input";

	static override styles: CSSResult = css`
        input {
            padding: 0.5em 1em;
            background-color: var(--elysia-color-aro);
            border: 1px solid var(--elysia-color-purple);
            color: var(--elysia-color-cullen);
            border-radius: 1rem;
            transition: all 0.1s;
            user-select: none;
            font-family: var(--elysia-font-family);

            &:hover {
                cursor: pointer;
                background-color: oklch(from var(--elysia-color-aro) calc(l * 1.1) c h);
            }

            &:active {
                background-color: oklch(from var(--elysia-color-aro) calc(l * 1.2) c h);
            }

            &:focus {
                outline: none;
            }

            &::placeholder {
                color: var(--elysia-color-purple);
            }

            &:invalid {
                background-color: oklch(from var(--elysia-color-red) calc(l * 1.15) c h);
            }

            &[type=number] {
                -moz-appearance: textfield;
            }
        }
	`

	@attribute() accessor value = "";

	@attribute() accessor placeholder = "";

	onChange?: (value: string) => void;

	public override onRender(): TemplateResult
	{
		return html`
			<input
					type="text"
					value="${this.value}"
					placeholder="${this.placeholder}"

			>
		`;
	}
}

defineComponent(ElysiaTextInput);
