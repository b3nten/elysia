import "./SSRPolyfill.ts";
import * as LitHtml from "lit-html";
import { type Scheduler, defaultScheduler } from "./Scheduler.ts";
import { isFunction } from "../Shared/Asserts.ts";
import { OffscreenUpdateStrategy } from "./UpdateStrategy.ts";
import { s_Attributes, s_Internal } from "../Internal/mod.ts";
import _css from "./Css.ts";
import _defineComponent from "./DefineComponent.ts";

const isUhtmlRenderResult = (
	value: unknown,
): value is LitHtml.TemplateResult => {
	return !!value && typeof value === "object" && "_$litType$" in value;
};

const supportsAdoptingStyleSheets: boolean =
	globalThis.ShadowRoot &&
	"adoptedStyleSheets" in Document.prototype &&
	"replace" in CSSStyleSheet.prototype;

export const defineComponent = _defineComponent;

export const html = LitHtml.html;

export const css = _css;

export const nothing = LitHtml.nothing;

export const svg = LitHtml.svg;

export const template = LitHtml.noChange;

export const unsafeHTML = LitHtml.mathml;

export type RenderOutput = LitHtml.TemplateResult;

interface ElysiaConstructor {
	Tag: string;
	ManualTracking?: boolean;
	Styles?: string | string[];
}

/**
 * Base class for Elysia web components implementing an Immediate Mode UI pattern.
 * Handles component lifecycle, rendering, and visibility-based update optimization.
 *
 * @example
 * ```ts
 * class MyComponent extends ElysiaElement {
 *   static override Tag = 'my-component';
 *
 *   override onMount() {
 *       console.log('Component mounted');
 *   }
 *
 *   override onUnmount() {
 *   	console.log('Component unmounted');
 *   }
 *
 *   protected override onRender() {
 *     return html`<div>Hello World</div>`;
 *   }
 * }
 * ```
 */
export abstract class ElysiaElement extends HTMLElement {
	/**
	 * The HTML tag name for this component. Must be overridden by derived classes.
	 * Must contain a hyphen as per Web Components specification.
	 */
	public static Tag: string = "unknown-elysia-element";

	/**
	 * Controls whether the component handles its own update tracking.
	 * If false (default), the component automatically tracks changes to onRender.
	 * If true, updates must be manually triggered via requestUpdate().
	 */
	public static ManualTracking: boolean = false;

	/**
	 * CSS styles to be applied to the component's shadow DOM.
	 * Can be a single string or an array of strings.
	 */
	public static Styles?: string | string[];

	/**
	 * The scheduler responsible for managing this component's update lifecycle.
	 * @default { defaultScheduler }
	 */
	public scheduler: Scheduler = defaultScheduler;

	/**
	 * Indicates whether the component is currently outside the viewport.
	 */
	public get offscreen(): boolean {
		return this.#offscreen;
	}

	/**
	 * Controls how the component updates when it's not visible in the viewport.
	 */
	public get offscreenUpdateStrategy(): OffscreenUpdateStrategy {
		return this.#offscreenUpdateStrategy;
	}

	/**
	 * Sets the update strategy for when the component is offscreen.
	 * @param value - The desired update strategy
	 */
	public setOffscreenUpdateStrategy(value: OffscreenUpdateStrategy) {
		this.#offscreenUpdateStrategy = value;

		if (this.offscreen) {
			if (value === OffscreenUpdateStrategy.Disabled)
				this.scheduler.unsubscribe(this);
			if (value === OffscreenUpdateStrategy.HighPriority)
				this.scheduler.subscribe(this);
		}
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.onRender = this.onRender.bind(this);
		this.bindStyles();
	}

	public connectedCallback(): void {
		for (const [propName, attr] of Object.entries(this[s_Attributes])) {
			const attrValue = this.getAttribute(attr.attrName);
			// @ts-ignore - sigh
			if (attrValue !== null) this[propName] = attrValue;
			// @ts-ignore - sigh
			else if (this[propName] !== undefined)
				this.setAttribute(attr.attrName, String(this[propName]));
		}
		this.forceUpdate(true);
		this.onMount();
		this.createIntersectionObserver();
	}

	public disconnectedCallback(): void {
		this.onUnmount();
		this.scheduler.unsubscribe(this);
		this.componentVisibilityObserver?.disconnect();
		this.onUnmount && this.onUnmount();
	}

	/**
	 * Requests the component to check if it needs to update.
	 * Compares current render output with previous render output to determine if an update is necessary.
	 */
	public requestUpdate(): void {
		for (const field of this.fieldsToCheck) {
			if (field == "onRender") {
				const currentRender = this.onRender();

				if (isUhtmlRenderResult(currentRender)) {
					if (
						!this.#renderResult ||
						this.compareRenderOutput(
							this.#renderResult.values,
							currentRender.values,
						) ||
						this.compareRenderOutput(
							this.#renderResult.strings,
							currentRender.strings,
						)
					) {
						this.#renderResult = currentRender;
						this.forceUpdate();
						return;
					}
				} else {
					throw new Error("onRender must return a RenderResult");
				}
			} else {
				// @ts-ignore
				if (this[field] !== this[Internal].field) {
					// @ts-ignore
					this[Internal].field = this[field];
					this.forceUpdate(true);
					return;
				}
			}
		}
	}

	/**
	 * Forces an immediate render of the component, bypassing the usual update checks.
	 * @param needsRender - If true, calls onRender(). If false, uses cached render result.
	 */
	public forceUpdate(needsRender = false): void {
		this.onBeforeRender();
		LitHtml.render(
			needsRender ? this.onRender() : this.#renderResult!,
			this.shadowRoot!,
			{ host: this },
		);
		this.onAfterRender();
	}

	/**
	 * Lifecycle hook called when the component is connected to the DOM.
	 * Use this to initialize resources, set up subscriptions, or perform other setup tasks.
	 * Called after initial attributes are set but before the first render.
	 */
	protected onMount(): void {}

	/**
	 * Lifecycle hook called immediately before each render.
	 * Use this to prepare data or perform calculations needed for rendering.
	 */
	protected onBeforeRender(): void {}

	/**
	 * Required render method that defines the component's template.
	 * Must return a valid render result using the html template literal tag.
	 *
	 * @example
	 * ```ts
	 * protected override onRender(): RenderOutput {
	 *   return html`<div>Hello ${this.name}</div>`;
	 * }
	 *```
	 * @returns A template result that will be rendered to the component's shadow DOM
	 */
	protected abstract onRender(): RenderOutput;

	/**
	 * Lifecycle hook called immediately after each render.
	 * Use this to perform tasks that require the updated DOM, like measurements or focus management.
	 */
	protected onAfterRender(): void {}

	/**
	 * Lifecycle hook called when the component is disconnected from the DOM.
	 * Use this to clean up resources, remove event listeners, or unsubscribe from subscriptions.
	 */
	protected onUnmount(): void {}

	protected fieldsToCheck: Array<PropertyKey> = [
		!(this.constructor as unknown as ElysiaConstructor).ManualTracking &&
			"onRender",
	].filter(Boolean) as string[];
	protected componentVisibilityObserver?: IntersectionObserver;

	private compareRenderOutput(
		a: unknown[] | TemplateStringsArray,
		b: unknown[] | TemplateStringsArray,
	): boolean {
		// if the lengths are different, we know the values are different and bail early
		if (a?.length !== b?.length) return true;

		for (let i = 0; i < a?.length; i++) {
			const prev = a[i],
				next = b[i];

			// functions are compared by name
			if (isFunction(prev) && isFunction(next)) {
				if (prev.name !== next.name) return true;
				else continue;
			}

			// lit template results are compared by their values
			if (isUhtmlRenderResult(prev) && isUhtmlRenderResult(next)) {
				return (
					this.compareRenderOutput(prev.values, next.values) &&
					this.compareRenderOutput(prev.strings, next.strings)
				);
			}

			// arrays are deeply compared
			if (Array.isArray(prev) && Array.isArray(next))
				return this.compareRenderOutput(prev, next);

			// strict equality check
			if (a[i] !== b[i]) return true;
		}

		return false;
	}

	private createIntersectionObserver(): void {
		this.componentVisibilityObserver = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					this.#offscreen = false;
					this.scheduler.subscribe(this);
				} else {
					this.#offscreen = true;
					this.setOffscreenUpdateStrategy(this.offscreenUpdateStrategy);
				}
			},
			{
				rootMargin: "25px",
			},
		);

		this.componentVisibilityObserver.observe(this);
	}

	private bindStyles(): void {
		const c = this.constructor as unknown as ElysiaConstructor;
		if (c.Styles) {
			if (Array.isArray(c.Styles) && c.Styles.length > 0) {
				if (supportsAdoptingStyleSheets) {
					this.shadowRoot!.adoptedStyleSheets = c.Styles.map((s) => {
						const sheet = new CSSStyleSheet();
						sheet.replaceSync(s);
						return sheet;
					});
				} else {
					const style = document.createElement("style");
					style.textContent = c.Styles.join("\n");
					this.shadowRoot!.appendChild(style);
				}
			} else if (typeof c.Styles === "string") {
				if (supportsAdoptingStyleSheets) {
					const sheet = new CSSStyleSheet();
					sheet.replaceSync(c.Styles);
					this.shadowRoot!.adoptedStyleSheets = [sheet];
				} else {
					const style = document.createElement("style");
					style.textContent = c.Styles;
					this.shadowRoot!.appendChild(style);
				}
			}
		}
	}

	[s_Internal]: Record<PropertyKey, unknown> = {};
	[s_Attributes]: Record<
		string,
		{ attrName: string; converter?: () => unknown }
	> = {};

	#renderResult: RenderOutput | null = null;
	#offscreen: boolean = true;
	#offscreenUpdateStrategy: OffscreenUpdateStrategy =
		OffscreenUpdateStrategy.Disabled;
}
