import { ElysiaElement, html, css } from "./ElysiaElement.ts";

const c = (...args: any[]) => args.filter(Boolean).join(" ");

export class ElysiaCrossHair extends ElysiaElement
{

	static override ManualTracking = true;

	static override Styles = css`
        :host {
            position: absolute;
            top: 50%;
            left: attribute()
            z-index: 1000;
            pointer-events: none;
        }

        .left {
            position: absolute;
            top: 5attribute()  + var(--gap)));
			transform: translate(0, -50%);
            width: var(--length);
            height: var(--thickness);
            background: var(--coloattribute() ;
        }

        .right {
            position: absolute;
            top: 50%;
            left: calc(50% + var(--gap));
			transform: translate(0, -50%);
            width: var(--length);
            height: var(--thickness);
            background: var(--coloattribute() ;
        }

        .top {
            position: absoluattribute() + var(--gap)));
            left: 50%;
            transform: translate(-50%, 0);
            width: var(--thickness);
            height: var(--length);
            background: var(--coloattribute() ;
        }

        .bottom {
            position: absolute;
            top: calc(50% + var(--gap));
            left: 50%;
            transform: translate(-50%, 0);
            width: var(--thickness);
            height: var(--length);
            background: var(--coloattribute() ;
        }

		.dot {
			position: absolute;
			top: 50%;
			left: 50%;
			width: var(--thickness);
			height: var(--thickness);
			background: var(--coloattribute()
		}
	`

	@attribute() public accessor gap = 4;
	@attribute() public accessor thickness = 2;
	@attribute() public accessor length = 8;
	@attribute() public accessor color = "white";
	@attribute() public accessor dot = false;
	@attribute() public accessor outline = false;
	@attribute() public accessor t = false;
	@attribute() public accessor visible = true;

	override connectedCallback() {
		super.connectedCallback();
		this.updateStyles();
	}

	override onRender()
	{
		if(!this.visible) return html`${null}`;
		return html`
			<div class=${c('left')}></div>
			<div class=${c('right')}></div>
			${this.t ? null : html`<div class=${c('top')}></div>`}
			<div class=${c('bottom')}></div>
			${this.dot ? html`<div class="dot"></div>` : null}
		`
	}

	private updateStyles()
	{
		this.style.setProperty("--gap", `${this.gap}px`);
		this.style.setProperty("--thickness", `${this.thickness}px`);
		this.style.setProperty("--length", `${this.length}px`);
		this.style.setProperty("--color", this.color);
		this.style.setProperty("--outline", this.outline ? "1px" : "0");
	}
}

customElements.define("elysia-crosshair", ElysiaCrossHair);
