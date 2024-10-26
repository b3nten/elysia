import type { CSSResult } from "../../../../Library/Caches/deno/npm/registry.npmjs.org/@lit/reactive-element/2.0.4/development/css-tag.d.ts";
import type { TemplateResult } from "lit";
import { attribute, css, defineComponent, ElysiaElement, html } from "./UI.ts";

export class ElysiaRange extends ElysiaElement {
	static override Tag = "elysia-range";

	static override styles: CSSResult = css`
        .slider {
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            cursor: pointer;
            outline: none;
            overflow: hidden;
            border-radius: 16px;
        }

        .slider::-webkit-slider-runnable-track {
            height: 20px;
            background: var(--elysia-color-aro);
            border-radius: 16px;
        }

        .slider::-moz-range-track {
            height: 25px;
            background: var(--elysia-color-aro);
            border-radius: 16px;
        }

        .slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            height: 20px;
            width: 20px;
            background-color: var(--elysia-color-cullen);
            border-radius: 50%;
            border: 2px solid var(--elysia-color-aro);
            box-shadow: -9999px 0 0 9990px var(--elysia-color-aro);
        }

        .slider::-moz-range-thumb {
            height: 25px;
            width: 25px;
            background-color: var(--elysia-color-foreground);
            border-radius: 50%;
            border: 1px solid var(--elysia-color-selection);
            box-shadow: -9997px 0 0 9990px var(--elysia-color-selection);
        }

        .value-wrap {
            display: flex;
            justify-content: space-between;
            margin-top: 0.5rem;
            font-family: var(--elysia-font-family);
            font-size: .5rem;
        }

        .val {
            font-size: .75rem;
            color: var(--elysia-color-purple);
        }
	`

	@attribute() accessor value = "0";

	@attribute() accessor min = "0";

	@attribute() accessor max = "100";

	@attribute() accessor step = "1";

	onChange?: (value: number) => void;

	public override onRender(): TemplateResult
	{
		return html`
			<div>
				<div class="value-wrap">
					<span>${this.min}</span>
					<span class="val">${this.value}</span>
					<span>${this.max}</span>
				</div>
				<input
						type="range"
						value="${this.value}"
						min="${this.min}"
						max="${this.max}"
						step="${this.step}"
						class="slider"
						@input=${this.#onInput}
				>
			</div>

		`;
	}

	#onInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		this.value = value;
		if (this.onChange) this.onChange(Number(value));
	}
}

defineComponent(ElysiaRange);
