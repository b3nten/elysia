import { type Scheduler, defaultScheduler } from "./Scheduler.ts";
import type { ElysiaElement } from "./ElysiaElement.ts";
import { OffscreenUpdateStrategy } from "./UpdateStrategy.ts";
import { Attributes, Internal } from "./Internal.ts";

const supportsAdoptingStyleSheets: boolean =
	globalThis.ShadowRoot &&
	'adoptedStyleSheets' in Document.prototype &&
	'replace' in CSSStyleSheet.prototype;

interface ElysiaConstructor
{
	Tag: string;
	ManualTracking?: boolean;
	Styles?: string | string[];
}

export abstract class ElysiaImmediateElement extends HTMLElement
{
	public static Tag: string = "unknown-elysia-element";

	public static Styles?: string | string[];

	public scheduler: Scheduler = defaultScheduler;

	public get offscreen(): boolean { return this.#offscreen; }
	public get offscreenUpdateStrategy(): OffscreenUpdateStrategy { return this.#offscreenUpdateStrategy; }
	public setOffscreenUpdateStrategy(value: OffscreenUpdateStrategy)
	{
		this.#offscreenUpdateStrategy = value;

		if(this.offscreen)
		{
			if(value === OffscreenUpdateStrategy.Disabled) this.scheduler.unsubscribe(this as unknown as ElysiaElement);
			if(value === OffscreenUpdateStrategy.HighPriority) this.scheduler.subscribe(this as unknown as ElysiaElement);
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
		this.forceUpdate();
		this.onMount();
		this.createIntersectionObserver();
	}

	public disconnectedCallback(): void
	{
		this.onUnmount();
		this.scheduler.unsubscribe(this as unknown as ElysiaElement);
		this.componentVisibilityObserver?.disconnect();
		this.onUnmount && this.onUnmount();
	}

	/** Force the component to render regardless of status. */
	public forceUpdate(): void
	{
		this.onBeforeRender();
		// @ts-ignore - sigh
		beginComponent(this.shadowRoot);
		this.onRender();
		endComponent();
		this.onAfterRender();
	}

	public requestUpdate(): void
	{
		this.forceUpdate();
	}

	protected onMount(): void {}
	protected onBeforeRender(): void {}
	protected abstract onRender(): void
	protected onAfterRender(): void {}
	protected onUnmount(): void {}

	protected componentVisibilityObserver?: IntersectionObserver;

	private createIntersectionObserver(): void
	{
		this.componentVisibilityObserver = new IntersectionObserver((entries) =>
		{
			if(entries.some(entry => entry.isIntersecting))
			{
				this.#offscreen = false;
				this.scheduler.subscribe(this as unknown as ElysiaElement)
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

	#offscreen: boolean = true;
	#offscreenUpdateStrategy: OffscreenUpdateStrategy = OffscreenUpdateStrategy.Disabled;
}

let rootElement: HTMLElement;

declare global {
	interface HTMLElement {
		__childCount?: number;
		__events: Map<keyof HTMLElementEventMap, any>;
	}
	interface Text {
		__childCount?: number;
	}
}

const isTextNode = (node: Node): node is Text =>
	node.nodeType === Node.TEXT_NODE;

const lastElement = () => elementStack[elementStack.length - 1];

const elementStack: Array<HTMLElement | Text> = [];

export function beginComponent(_rootElement: HTMLElement) {
	rootElement = _rootElement;
	elementStack.push(_rootElement);
}

export function endComponent() {
	elementStack.length = 0;
	rootElement.__childCount = 0;
}

export function begin_tag(tag: string) {
	const parent = lastElement();
	if (!parent) throw new Error("No parent element found");

	if (isTextNode(parent)) {
		throw new Error("Cannot append children to a text node");
	}

	if (typeof parent.__childCount !== "number") parent.__childCount = 0;

	if (parent.childNodes[parent.__childCount]) {
		if (
			parent.childNodes[parent.__childCount].nodeName === tag.toUpperCase() &&
			!isTextNode(parent.childNodes[parent.__childCount])
		) {
			elementStack.push(parent.childNodes[parent.__childCount] as HTMLElement);
		} else {
			parent.childNodes[parent.__childCount].remove();
			const el = document.createElement(tag);
			parent.insertBefore(el, parent.childNodes[parent.__childCount]);
			elementStack.push(el);
		}
	} else {
		const el = document.createElement(tag);
		parent.append(el);
		elementStack.push(el);
	}

	parent.__childCount += 1;
}

export function close() {
	const el = elementStack.pop();
	const childCount = el?.__childCount ?? 0;
	if (el) {
		el.__childCount = 0;
		if (childCount < el?.childNodes?.length) {
			for (let i = el.childNodes.length - 1; i >= childCount; i--) {
				el.childNodes[i].remove();
			}
		}
	}
}

export function attribute(name: string, value: string) {
	const element = lastElement();
	if (!element) throw new Error("No element found");
	if (isTextNode(element)) {
		throw new Error("Cannot set attributes on a text node");
	}
	element.setAttribute(name, value);
}

export function event(name: keyof HTMLElementEventMap, handler: (e: any) => void) {
	const element = lastElement();

	if (!element) throw new Error("No element found");
	if (isTextNode(element)) throw new Error("Cannot set events on a text node");

	if (element.__events === undefined) element.__events = new Map();

	if (!element.__events.has(name)) {
		element.__events.set(name, handler);
		element.addEventListener(name, handler);
	} else if (element.__events.get(name) !== handler) {
		element.removeEventListener(name, element.__events.get(name)!);
		element.addEventListener(name, handler);
		element.__events.set(name, handler);
	}
}

export function text(str: string) {
	const parent = lastElement();
	if (!parent) throw new Error("No parent element found");
	if (isTextNode(parent)) {
		throw new Error("Cannot append children to a text node");
	}

	if (typeof parent.__childCount !== "number") parent.__childCount = 0;
	if (
		parent.childNodes[parent.__childCount] &&
		parent.childNodes[parent.__childCount].nodeName === "#text"
	) {
		if ((parent.childNodes[parent.__childCount] as Text).data !== str) {
			(parent.childNodes[parent.__childCount] as Text).data = str;
		}
	} else {
		const el = document.createTextNode(str);
		parent.append(el);
	}

	parent.__childCount += 1;
}

export const Elements = new Proxy({}, {
	get(target, prop: string) {
		return () => begin_tag(prop);
	}
}) as Record<string, Function>

export const Close = close;
export const Text = text;