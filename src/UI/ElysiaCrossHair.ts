import { css, ElysiaElement, html } from "./ElysiaElement.ts";

const c = (...args: any[]) => args.filter(Boolean).join(" ");

export class ElysiaCrossHair extends ElysiaElement
{
	static override Styles = css`
        :host {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
            pointer-events: none;
        }

        .left {
            position: absolute;
            top: 50%;
            left: calc(50% - calc(var(--length) + var(--gap)));
			transform: translate(0, -50%);
            width: var(--length);
            height: var(--thickness);
            background: var(--color);
            outline: black solid var(--outline);
        }

        .right {
            position: absolute;
            top: 50%;
            left: calc(50% + var(--gap));
			transform: translate(0, -50%);
            width: var(--length);
            height: var(--thickness);
            background: var(--color);
			outline: black solid var(--outline);
        }

        .top {
            position: absolute;
            top: calc(50% - calc(var(--length) + var(--gap)));
            left: 50%;
            transform: translate(-50%, 0);
            width: var(--thickness);
            height: var(--length);
            background: var(--color);
            outline: black solid var(--outline);
        }

        .bottom {
            position: absolute;
            top: calc(50% + var(--gap));
            left: 50%;
            transform: translate(-50%, 0);
            width: var(--thickness);
            height: var(--length);
            background: var(--color);
            outline: black solid var(--outline);
        }

		.dot {
			position: absolute;
			top: 50%;
			left: 50%;
			width: var(--thickness);
			height: var(--thickness);
			background: var(--color);
			outline: black solid var(--outline);
			transform: translate(-50%, -50%);
		}
	`

	public get gap(): number { return Number(this.getAttribute("gap")) ?? 4; }
	public set gap(value: number) { this.setAttribute("gap", value.toString()); }

	public get thickness(): number { return Number(this.getAttribute("thickness")) ?? 2; }
	public set thickness(value: number) { this.setAttribute("thickness", value.toString()); }

	public get length(): number { return Number(this.getAttribute("length")) ?? 8; }
	public set length(value: number) { this.setAttribute("length", value.toString()); }

	public get color(): string { return this.getAttribute("color") ?? "white"; }
	public set color(value: string) { this.setAttribute("color", value); }

	public get dot(): boolean { return this.hasAttribute("dot"); }
	public set dot(value: boolean) { if(value) this.setAttribute("dot", ""); else this.removeAttribute("dot"); }

	public get outline(): boolean { return this.hasAttribute("outline"); }
	public set outline(value: boolean) { if(value) this.setAttribute("outline", ""); else this.removeAttribute("outline"); }

	public get t(): boolean { return this.hasAttribute("t"); }
	public set t(value: boolean) { if(value) this.setAttribute("t", ""); else this.removeAttribute("t"); }

	public get visible(): boolean { return this.hasAttribute("visible"); }
	public set visible(value: boolean) { if(value) this.setAttribute("visible", ""); else this.removeAttribute("visible"); }

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