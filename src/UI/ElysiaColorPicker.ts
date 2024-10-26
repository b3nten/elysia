import { css, defineComponent, ElysiaElement, html } from "./UI.ts";
import "corel-color-picker/corel-color-picker.js"
import { query } from "lit/decorators.js";
import type { CSSResult } from "../../../../Library/Caches/deno/npm/registry.npmjs.org/@lit/reactive-element/2.0.4/development/reactive-element.d.ts";
import type { TemplateResult } from "lit";

export class ElysiaColorPicker extends ElysiaElement {
	static override Tag = "elysia-color-picker";

	static override styles: CSSResult = css`
        button {
            padding: 1.25em 1.25em;
            border: none;
            border-radius: 1rem;
            user-select: none;
        }

        #swatch {
            background: var(--elysia-color-aro);
            border: none;
            border-radius: 12px;
            padding: 1rem;
            filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
            border: 1px solid var(--elysia-color-voncount);
        }

        .color-text {
            font-family: var(--elysia-font-family);
            font-size: 0.75rem;
            color: var(--elysia-color-pink)
        }

        .flexer {
            display: flex;
            justify-content: space-between;
        }

        button {
            cursor: pointer;
        }
	`

	@query("#picker") accessor picker: Element | null = null;

	open = false;

	color = "#FF55A7";

	public override onRender(): TemplateResult
	{
		return html`
			<button popovertarget="swatch" style=${`background: ${this.color}`}></button>
			<div id="swatch" popover>
				<div class="flexer">
					<div class="color-text">color</div>
					<div class="color-text" style=${`color: ${this.color}`}>${this.color}</div>
				</div>
				<corel-color-picker id="picker" @change=${this.#onInput} value=${this.color}>
					<corel-color-picker>
			</div>
		`;
	}

	#onInput = (e: Event) => {
		this.color = (this.picker as HTMLInputElement).value;
	}
}

defineComponent(ElysiaColorPicker);
