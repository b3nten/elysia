import { ElysiaElement, defineComponent, html } from "./ElysiaElement.ts";
import { ELYSIA_VERSION } from "../Shared/Constants.ts";
import { css, defaultScheduler } from "./mod.ts";

export class ElysiaStats extends ElysiaElement
{
	static override Tag = "elysia-stats";

	static override Styles = css`
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
			font-family: Kode Mono, serif;
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

	visible = false;

	public stats = {
		calls: 0,
		fps: 0,
		lines: 0,
		points: 0,
		triangles: 0,
		memory: 0,
	}

	override onMount() {
		document.head.insertAdjacentHTML(
			'beforeend',
			`<link href="https://fonts.googleapis.com/css2?family=Kode+Mono:wght@400..700&display=swap" rel="stylesheet">`
		);
		setTimeout(() => this.visible = true, 500);
	}

	override onRender()
	{
		return html`
			<aside id="stats" class=${this.visible ? '' : 'inv'}>
				<div class="purple">elsyia ${ELYSIA_VERSION}</div>
				<div class=${this.stats.fps < 30 ? 'red' : 'white'}>fps: ${this.stats.fps}</div>
				<div class=${this.stats.calls > 1000 ? 'red' : 'white'}>drawcalls: ${this.stats.calls}</div>
				<div>memory: ${this.stats.memory}</div>
				<div>triangles: ${this.stats.triangles}</div>
				<div>lines: ${this.stats.lines}</div>
				<div>points: ${this.stats.points}</div>
				${defaultScheduler.components.size > 1 ? html`<div>ui components: ${defaultScheduler.components.size}</div>` : ''}
				${defaultScheduler.components.size > 1 ? html`<div>ui updates: ${defaultScheduler.frametime.toFixed(0)}ms</div>` : ''}
			</aside>
		`
	}
}

defineComponent(ElysiaStats);
