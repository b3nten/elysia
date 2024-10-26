import { defineComponent, ElysiaElement, html } from "./UI.ts";
import { Colors } from "../Core/Colors.ts";
import { attribute } from "./UI.ts";
import type { TemplateResult } from "lit";

export class ElysiaTheme extends ElysiaElement
{
	static override Tag = 'elysia-theme';

	@attribute() accessor cullen: string = Colors.Cullen;
	@attribute() accessor nosferatu: string = Colors.Nosferatu;
	@attribute() accessor vonCount: string = Colors.VonCount;
	@attribute() accessor aro: string = Colors.Aro;
	@attribute() accessor red: string = Colors.Red;
	@attribute() accessor orange: string = Colors.Orange;
	@attribute() accessor yellow: string = Colors.Yellow;
	@attribute() accessor green: string = Colors.Green;
	@attribute() accessor purple: string = Colors.Purple;
	@attribute() accessor cyan: string = Colors.Cyan;
	@attribute() accessor pink: string = Colors.Pink;
	@attribute() accessor font: string = 'Kode Mono, sans';

	override onRender(): TemplateResult { return html`<slot></slot>` }

	override attributeChangedCallback(name: string, _old: string | null, value: string | null) {
		super.attributeChangedCallback(name, _old, value);
		this.#updateStyles();
	}

	override onMount() {
		this.#updateStyles();
		document.head.insertAdjacentHTML(
			'beforeend',
			`<link href="https://fonts.googleapis.com/css2?family=Kode+Mono:wght@400..700&display=swap" rel="stylesheet">`
		);
	}

	#updateStyles()
	{
		this.style.setProperty('--elysia-color-cullen', this.cullen);
		this.style.setProperty('--elysia-color-nosferatu', this.nosferatu);
		this.style.setProperty('--elysia-color-voncount', this.vonCount);
		this.style.setProperty('--elysia-color-aro', this.aro);
		this.style.setProperty('--elysia-color-red', this.red);
		this.style.setProperty('--elysia-color-orange', this.orange);
		this.style.setProperty('--elysia-color-yellow', this.yellow);
		this.style.setProperty('--elysia-color-green', this.green);
		this.style.setProperty('--elysia-color-purple', this.purple);
		this.style.setProperty('--elysia-color-cyan', this.cyan);
		this.style.setProperty('--elysia-color-pink', this.pink);
		this.style.setProperty('--elysia-font-family', 'Kode Mono, sans');
	}
}

defineComponent(ElysiaTheme);
