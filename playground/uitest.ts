import { ElysiaImmediateElement, Elements, close, event, attribute, Text } from "../src/UI/ElysiaImmediateElement.ts";
import { defineComponent, css, html, defaultScheduler, ElysiaElement, RenderOutput } from "../src/UI/mod.ts";
const { Div, Button, Span, P } = Elements;

defaultScheduler.beginAutomaticUpdateLoop();

// class TestComponent extends ElysiaImmediateElement
// {
// 	static override Tag = "test-component";
//
// 	static override Styles = css``
//
// 	count = 20;
//
// 	override onRender(): void
// 	{
// 		Div()
// 		{
// 			Text(`The count is ${this.count}`);
// 			Button()
// 			{
// 				Text("Click Me")
// 				event("click", () => {
// 					this.count++;
// 				})
// 			}
// 			close()
// 			Span()
// 			{
// 				for(let i = 0; i < this.count*3; i++) {
// 					Span();
// 						Text("X");
// 					close()
// 				}
// 			}close()
// 		}
// 		close()
// 	}
// }

class TestComponent extends ElysiaElement
{
	static override Tag = "test-component";

	count = 20;

	protected onRender(): RenderOutput {
		return html`
			<div>
				<p>The count is ${this.count}</p>
				<button @click=${() => this.count++}>Click Me</button>
				${Array(this.count*3).fill(html`X`)}
			</div>
		`
	}
}


defineComponent(TestComponent)


for(let i = 0; i < 1000; i++)
{
	document.body.appendChild(document.createElement("test-component"))
}
