import { css, ElysiaElement, html } from "../src/UI/ElysiaElement.ts";
import { defaultScheduler } from "../src/UI/Scheduler.ts";

class UITest extends ElysiaElement
{
	public static override Tag: string = "ui-test";

	public static override Styles = css`
		:host {
			color: red;
		}
	`

	get foo()
	{
		return performance.now().toFixed(2)
		// return window.innerWidth
	}

	get components()
	{
		return defaultScheduler.components.size;
	}

	protected override fieldsToCheck =  [ "foo" ];

	public onRender()
	{
		return html`<div>${this.foo} ${this.components}</div>`
	}
}
customElements.define( UITest.Tag, UITest );

defaultScheduler.beginAutomaticUpdateLoop();

const bdy = Array(1000).fill(0).map(() => `<ui-test foo="bar"></ui-test>`).join("")
document.body.innerHTML = bdy;
