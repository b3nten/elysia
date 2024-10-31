import * as uhtml from "npm:uhtml"
// import * as uhtml from "npm:lit-html"
import { type Scheduler, defaultScheduler } from "./Scheduler.ts";
import { isFunction } from "../Core/Asserts.ts";
import type { Constructor } from "../Core/Utilities.ts";

export enum OffscreenUpdateStrategy
{
	Disabled,
	HighPriority
}

const isUhtmlRenderResult  = ( value: unknown): value is uhtml.Hole =>
{
	return !!value && (typeof value === "object") && value instanceof uhtml.Hole;
}

const supportsAdoptingStyleSheets: boolean =
  globalThis.ShadowRoot &&
  'adoptedStyleSheets' in Document.prototype &&
  'replace' in CSSStyleSheet.prototype;

const Internal = Symbol.for("ElysiaUI::Internal")

export const Attributes = Symbol.for("ElysiaUI::Attributes");

export const html = uhtml.html;

export const css = (strings: TemplateStringsArray, ...values: unknown[]): string => {
	return strings.map((str, i) => str + (values[i] || "")).join("");
}

export function defineComponent(component: Constructor<ElysiaElement> & { Tag: string })
{
	if(!component.Tag || component.Tag === "unknown-elysia-element")
	{
		throw new Error(`You must define a tag for ${component.name}!`)
	}
	if(!customElements.get(component.Tag))
	{
		customElements.define(component.Tag, component);
	}
}

export type RenderOutput = uhtml.Hole;

interface ElysiaConstructor
{
	Tag: string;
	ManualTracking?: boolean;
	Styles?: string | string[];
}

export abstract class ElysiaElement extends HTMLElement
{
	public static Tag: string = "unknown-elysia-element";
	public static ManualTracking: boolean = false;
	public static Styles?: string | string[];
	public scheduler: Scheduler = defaultScheduler;

	public get offscreen(): boolean { return this.#offscreen; }
	public get offscreenUpdateStrategy(): OffscreenUpdateStrategy { return this.#offscreenUpdateStrategy; }
	public setOffscreenUpdateStrategy(value: OffscreenUpdateStrategy)
	{
		this.#offscreenUpdateStrategy = value;

		if(this.offscreen)
		{
			if(value === OffscreenUpdateStrategy.Disabled) this.scheduler.unsubscribe(this);
			if(value === OffscreenUpdateStrategy.HighPriority) this.scheduler.subscribe(this);
		}
	}

	constructor()
	{
		super();
		this.attachShadow( { mode: "open" } );
		this.onRender = this.onRender.bind( this );
		this.bindStyles();
	}

	public connectedCallback(): void
	{
		for(const [propName, attr] of Object.entries(this[Attributes]))
		{
			const attrValue = this.getAttribute(attr.attrName);
			// @ts-ignore - sigh
			if(attrValue !== null) this[propName] = attrValue;
			// @ts-ignore - sigh
			else if (this[propName] !== undefined) this.setAttribute(attr.attrName, String(this[propName]));
		}
		this.forceUpdate(true);
		this.onMount();
		this.createIntersectionObserver();
	}

	public disconnectedCallback(): void
	{
		this.onUnmount();
		this.scheduler.unsubscribe(this);
		this.componentVisibilityObserver?.disconnect();
		this.onUnmount && this.onUnmount();
	}

	/** Request the component check if it needs to update. */
	public requestUpdate(): void
	{
		for(const field of this.fieldsToCheck)
		{
			if(field == 'onRender')
			{
				const currentRender = this.onRender();

				if (isUhtmlRenderResult(currentRender))
				{
					if (
						!this.#renderResult
						|| this.compareRenderOutput(this.#renderResult.v, currentRender.v)
						|| this.compareRenderOutput(this.#renderResult.s, currentRender.s)
					)
					{
						this.#renderResult = currentRender;
						this.forceUpdate();
					  	return;
					}
				}
				else
				{
					throw new Error("onRender must return a RenderResult");
			 	}
			}
			else
			{
				// @ts-ignore
				if(this[field] !== this[Internal].field)
				{
					// @ts-ignore
					this[Internal].field = this[field];
					this.forceUpdate(true);
					return;
				}
			}
		}
	}

	/** Force the component to render regardless of status. */
	public forceUpdate(needsRender = false): void
	{
		this.onBeforeRender();
		uhtml.render( this.shadowRoot, needsRender ? this.onRender() : this.#renderResult! );
		this.onAfterRender();
	}

	protected onMount(): void {}
	protected onBeforeRender(): void {}
	protected abstract onRender(): RenderOutput
	protected onAfterRender(): void {}
	protected onUnmount(): void {}

	protected fieldsToCheck: Array<PropertyKey> = [!(this.constructor as unknown as ElysiaConstructor).ManualTracking && "onRender"].filter(Boolean) as string[];
	protected componentVisibilityObserver?: IntersectionObserver;

	private compareRenderOutput(a: unknown[] | TemplateStringsArray, b: unknown[] | TemplateStringsArray): boolean
	{
		// if the lengths are different, we know the values are different and bail early
		if (a?.length !== b?.length) return true;

		for (let i = 0; i < a?.length; i++)
		{
			const prev = a[i], next = b[i];

			// functions are compared by name
			if (isFunction(prev) && isFunction(next))
			{
				if (prev.name !== next.name) return true;
				else continue;
			}

			// lit template results are compared by their values
			if (isUhtmlRenderResult(prev) && isUhtmlRenderResult(next))
			{
				return this.compareRenderOutput(prev.v, next.v) && this.compareRenderOutput(prev.s, next.s);
			}

			// arrays are deeply compared
			if (Array.isArray(prev) && Array.isArray(next)) return this.compareRenderOutput(prev, next);

			// strict equality check
			if (a[i] !== b[i]) return true;
		}

		return false;
	}

	private createIntersectionObserver(): void
	{
		this.componentVisibilityObserver = new IntersectionObserver((entries) =>
		{
			if(entries.some(entry => entry.isIntersecting))
			{
				this.#offscreen = false;
				this.scheduler.subscribe(this)
			}
			else
			{
				this.#offscreen = true;
				this.setOffscreenUpdateStrategy(this.offscreenUpdateStrategy)
			}
		}, {
			rootMargin: "25px"
		})

		this.componentVisibilityObserver.observe(this)
	}

	private bindStyles(): void
	{
		const c = this.constructor as unknown as ElysiaConstructor;
		if( c.Styles )
		{
			if( Array.isArray( c.Styles ) && c.Styles.length > 0 )
			{
				if(supportsAdoptingStyleSheets)
				{
					this.shadowRoot!.adoptedStyleSheets = c.Styles.map( s => {
						const sheet = new CSSStyleSheet()
						sheet.replaceSync( s );
						return sheet;
					});
				}
				else
				{
					const style = document.createElement( "style" );
					style.textContent = c.Styles.join( "\n" );
					this.shadowRoot!.appendChild( style );
				}
			}
			else if ( typeof c.Styles === "string" )
			{
				if(supportsAdoptingStyleSheets)
				{
					const sheet = new CSSStyleSheet()
					sheet.replaceSync( c.Styles );
					this.shadowRoot!.adoptedStyleSheets = [ sheet ];
				}
				else
				{
					const style = document.createElement( "style" );
					style.textContent = c.Styles;
					this.shadowRoot!.appendChild( style );
				}
			}
		}
	}

	[Internal]: Record<PropertyKey, unknown> = {};
	[Attributes]: Record<string, { attrName: string, converter?: () => unknown }> = {};

	#renderResult: RenderOutput | null = null
	#offscreen: boolean = true;
	#offscreenUpdateStrategy: OffscreenUpdateStrategy = OffscreenUpdateStrategy.Disabled;
}
