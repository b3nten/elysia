import { defineComponent, ElysiaElement, html } from "./ElysiaElement.ts";
import { Colors } from "../Core/Colors.ts";
import { attribute } from "./Decorators.ts";

export class ElysiaTheme extends ElysiaElement
{
	static override Tag = 'elysia-theme';

	get cullen() { return this.getAttribute('cullen') ?? Colors.Cullen; }
	set cullen(value) { this.setAttribute('cullen', value); }
	get nosferatu() { return this.getAttribute('nosferatu') ?? Colors.Nosferatu; }
	set nosferatu(value) { this.setAttribute('nosferatu', value); }
	get vonCount() { return this.getAttribute('voncount') ?? Colors.VonCount; }
	set vonCount(value) { this.setAttribute('voncount', value); }
	get aro() { return this.getAttribute('aro') ?? Colors.Aro; }
	set aro(value) { this.setAttribute('aro', value); }
	get red() { return this.getAttribute('red') ?? Colors.Red; }
	set red(value) { this.setAttribute('red', value); }
	get orange() { return this.getAttribute('orange') ?? Colors.Orange; }
	set orange(value) { this.setAttribute('orange', value); }
	get yellow() { return this.getAttribute('yellow') ?? Colors.Yellow; }
	set yellow(value) { this.setAttribute('yellow', value); }
	get green() { return this.getAttribute('green') ?? Colors.Green; }
	set green(value) { this.setAttribute('green', value); }
	get purple() { return this.getAttribute('purple') ?? Colors.Purple; }
	set purple(value) { this.setAttribute('purple', value); }
	get cyan() { return this.getAttribute('cyan') ?? Colors.Cyan; }
	set cyan(value) { this.setAttribute('cyan', value); }
	get pink() { return this.getAttribute('pink') ?? Colors.Pink; }
	set pink(value) { this.setAttribute('pink', value); }

	override onRender() { return html`<slot></slot>` }

	attributeChangedCallback()
	{
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
