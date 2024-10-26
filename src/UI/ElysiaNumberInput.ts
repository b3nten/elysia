import { attribute, css, defineComponent, ElysiaElement, html } from "./UI.ts";
import { query } from "lit/decorators.js";
import { bound } from "../Core/Utilities.ts";
import type { CSSResult } from "../../../../Library/Caches/deno/npm/registry.npmjs.org/@lit/reactive-element/2.0.4/development/css-tag.d.ts";
import type { TemplateResult } from "lit";

export class ElysiaNumberInput extends ElysiaElement {
	static override Tag = "elysia-number-input";

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

            &::-webkit-inner-spin-button,
            &::-webkit-outer-spin-button {
                -webkit-appearance: none;
            }

            &[type=number] {
                -moz-appearance: textfield;
            }

            &:invalid {
                background-color: oklch(from var(--elysia-color-red) calc(l * 1.15) c h);
            }
        }
	`

	@query("#input") accessor input: Element | null = null;

	@attribute({ type: Number }) accessor value: number | undefined;

	@attribute({ type: Number }) accessor defaultValue = 0;

	@attribute() accessor min = "-Infinity";

	@attribute() accessor max = "Infinity";

	@attribute({ type: Number }) accessor step = 0.1;

	private controlled = false;

	override onMount() { if(typeof this.value !== "undefined") this.controlled = true; }

	public override onRender(): TemplateResult
	{
		return html`
			<input
					part="input"
					id="input"
					type="number"
					.value=${this.controlled}
					min=${this.min}
					max=${this.max}
					step=${this.step}
					@mousedown=${this.onMouseDown}
					@change=${this.onChange}
			>
		`;
	}

	initialMousePos = {x: 0, y: 0};

	onMouseDown = (e: MouseEvent) => {
		const bounds = this.input?.getBoundingClientRect();
		if (bounds && e.clientX < bounds.left + bounds.width * 0.5) return;

		this.initialMousePos = {x: e.clientX, y: e.clientY};

		window.addEventListener("mousemove", this.onMouseDrag);
		window.addEventListener("mouseup", this.onMouseUp);
	}

	onMouseDrag = (e: MouseEvent): void => {
		e.stopPropagation();
		const step = Number(this.step);

		const value = Number(this.value) + Math.round(e.clientX - this.initialMousePos.x) * step;

		const final = Number(Math.min(Math.max(value, Number(this.min)), Number(this.max)).toFixed(2));

		if(this.controlled) (this.input as HTMLInputElement).value = String(value);
		else this.value = final;

		this.dispatchEvent(new CustomEvent("change", { detail: final }));

		this.initialMousePos = {x: e.clientX, y: e.clientY};
	}

	onMouseUp = (): void => {
		window.removeEventListener("mousemove", this.onMouseDrag);
		window.removeEventListener("mouseup", this.onMouseUp);
	}

	@bound private onChange(e: Event)
	{
		const val = (this.input as HTMLInputElement).value;
		if(this.controlled) (this.input as HTMLInputElement).value = val;
		else this.value = Number(val);
		this.dispatchEvent(new CustomEvent("change", { detail: val }));
	}
}

defineComponent(ElysiaNumberInput);
