import { ElysiaElement, defineComponent, h, c, defaultScheduler } from "./UI.ts";
import { ELYSIA_VERSION } from "../Core/Constants.ts";
import { nothing } from "lit";
import type { CSSResult } from "../../../../Library/Caches/deno/npm/registry.npmjs.org/@lit/reactive-element/2.0.4/development/css-tag.d.ts";
import type { TemplateResult } from "../../../../Library/Caches/deno/npm/registry.npmjs.org/lit-element/4.1.1/development/lit-element.d.ts";

export class ElysiaUiStats extends ElysiaElement
{
	static override Tag = "elysia-ui-stats";

	visible = false;

	public override scheduler = defaultScheduler;

	static override styles: CSSResult = c`
		:host {
			position: fixed;
			bottom: 0;
			left: 0;
			z-index: 1000;
			pointer-events: none;
		}
		aside {
			background: #282a3680;
			color: white;
			padding: 0.5em;
			font-family: Kode Mono, sans;
			font-size: .7em;
			font-weight: 300;
			display: flex;
			grid-template-columns: 1fr 1fr;
			grid-gap: .25em 1em;
			border-radius: 0 .5em 0 0;
			backdrop-filter: blur(2px);
			transition: all 0.5s ease;
		}
		@media (max-width: 620px) {
			aside {
				display: grid;
				font-size: .5em;
			}
		}
		.purple { color: #FF79C6; }
		.red { color: #FF5555; }
		.white { color: #f8f8f2; }
		.inv { opacity: 0; transform: translateY(100%); }
	`

	override onMount() {
		document.head.insertAdjacentHTML(
			'beforeend',
			`<link href="https://fonts.googleapis.com/css2?family=Kode+Mono:wght@400..700&display=swap" rel="stylesheet">`
		);
		setTimeout(() => this.visible = true, 500);
	}

	override onRender(): TemplateResult
	{
		return h`
			<aside id="stats" class=${this.visible ? '' : 'inv'}>
				<div class="purple">elsyia ui ${ELYSIA_VERSION}</div>
				<div class=${this.scheduler.frametime > 12 ? 'red' : nothing}>update delta: ${this.scheduler.frametime.toFixed(0)}</div>
				<div class="white">components: ${this.scheduler.components.size}</div>
			</aside>
		`
	}
}

defineComponent(ElysiaUiStats);
