import { attribute, BooleanConverter, css, defineComponent, ElysiaElement, html } from "./UI.ts";
import { query } from "lit/decorators.js";
import { bound, toBoolean } from "../Core/Utilities.ts";
import type { CSSResult } from "../../../../Library/Caches/deno/npm/registry.npmjs.org/@lit/reactive-element/2.0.4/development/css-tag.d.ts";
import type { TemplateResult } from "lit";

export class ElysiaBoolean extends ElysiaElement {
	static override Tag = "elysia-boolean";

	static override styles: CSSResult = css`
        input {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            position: relative;
            font-size: inherit;
            width: 3rem;
            height: 1.5rem;
            box-sizing: content-box;
            border-radius: 1rem;
            vertical-align: text-bottom;
            margin: auto;
            color: inherit;
            background-color: var(--elysia-color-aro);
			cursor: pointer;

            &::before {
                content: "";
                position: absolute;
                top: 50%;
                left: 0;
                transform: translate(0, -50%);
                transition: all 0.2s ease;
                box-sizing: border-box;
                width: 1.3rem;
                height: 1.3rem;
                margin: 0 0.125rem;
                border-radius: 50%;
                background: var(--elysia-color-voncount);
            }

            &:checked {
                background: var(--elysia-color-voncount);
            }

            &:checked::before {
                left: 1.45rem;
                background-color: var(--elysia-color-cullen);
            }
        }
	`

	@query("#input") accessor input: HTMLInputElement | null = null;

	public get value(): boolean { return this.#internalValue; }

	@attribute() public set value (val: boolean)
	{
		if(typeof val === undefined)
		{
			this.controlled = false;
			this.#internalValue = !!this.input?.checked;
		}
		else
		{
			this.controlled = true;
			this.#internalValue = BooleanConverter(val);
			if(this.input) this.input.checked = BooleanConverter(val);
		}
	}

	@attribute({ converter: BooleanConverter }) accessor defaultValue = false;

	private controlled = false;

	override onMount()
	{
		if(typeof this.value !== "undefined")
		{
			this.controlled = true;
			this.#internalValue = toBoolean(this.value);
		}
		else
		{
			this.value = this.defaultValue;
			this.controlled = false;
		}
	}

	public override onRender(): TemplateResult
	{
		return html`<input id="input" type="checkbox" .checked="${this.#internalValue}" @change=${this.onChange}>`;
	}

	@bound private onChange (e: Event)
	{
		const val = (e.target as HTMLInputElement).checked;
		if(this.controlled) (this.input as HTMLInputElement).checked = !!this.value;
		else this.#internalValue = (e.target as HTMLInputElement).checked;
		this.dispatchEvent(new CustomEvent("change", { detail: val }));
	}

	#internalValue = false;
}

defineComponent(ElysiaBoolean);
