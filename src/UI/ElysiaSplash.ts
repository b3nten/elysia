import logo_transparent from "../../assets/logo_transparent.ts";
import { css, defineComponent, ElysiaElement, html } from "./ElysiaElement.ts";

export class ElysiaSplash extends ElysiaElement
{
	static override Tag = "elysia-splash";
	static override ManualTracking = true;
	static override Styles = css`
        :host {
            z-index: 10000;
            position: absolute;
            inset: 0;
            background: #EBEAEC;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #979cab;
            font-family: 'Kode Mono', serif;
            transition: opacity 1s ease-out;
        }

        #container {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            opacity: 0;
            transition: opacity 1s ease-in-out;
        }

        img {
            width: 50vw;
            max-width: 300px;
        }
	`

	get container(): HTMLDivElement { return this.shadowRoot!.getElementById("container") as HTMLDivElement; }

	override onMount()
	{
		this.mountedAt = performance.now()
		setTimeout(() => this.container.style.opacity = "1", 500);
	}

	goodbye = (): void =>
	{
		let timeRemaining = 3000 - (performance.now() - this.mountedAt);
		if(timeRemaining < 0) timeRemaining = 0;
		this.style.opacity = "0";
		this.style.pointerEvents = "none";
		setTimeout(() => super.remove(), timeRemaining);
	}

	override onRender()
	{
		return html`
			<div id="container">
				<img id="img" src="${logo_transparent}">
				<div id="text">ELYSIA ENGINE</div>
			</div>
		`
	}

	private mountedAt = 0;
}

defineComponent(ElysiaSplash)