import { css, html, LitElement, PropertyDeclaration, PropertyValueMap, svg, TemplateResult } from "lit";
import { defaultScheduler, Scheduler } from "./Scheduler.ts";
import { Constructor, tick } from "../Core/Utilities.ts";
import { isFunction } from "../Core/Asserts.ts";
import { property } from "lit/decorators/property.js";

export {
	css,
	css as c,
	svg,
	svg as s,
	html,
	html as h,
	defineComponent,
	Scheduler,
	defaultScheduler,
	ElysiaElement,
	OffscreenUpdateStrategy,
	attribute,
	track
};

const isLitTemplateResult = (value: unknown): value is TemplateResult => !!value && (typeof value === "object") && ("_$litType$" in value);

function defineComponent(component: Constructor<ElysiaElement> & { Tag: string })
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

const strictEqual = (a: any, b: any) => a === b;

function attribute(options: {
	reflect?: boolean,
	converter?: PropertyDeclaration["converter"],
	type?: PropertyDeclaration["type"],
	hasChanged?: PropertyDeclaration["hasChanged"]
} = {}): any
{
	return property({
		attribute: true,
		reflect: options.reflect ?? true,
		converter: options.converter,
		hasChanged: options.hasChanged ?? strictEqual,
		type: options.type,
	})
}

// @ts-ignore todo: type decorators
function track(_: any, context: any){
	if(context.kind !== "getter" && context.kind !== "field" && context.kind !== "accessor")
		throw new Error("Track decorator can only be applied to fields, getters, and accessors.");
	context.addInitializer(function () {
		// @ts-ignore
		this.fieldsToCheck.push(context.name);
	});
}

enum OffscreenUpdateStrategy
{
	Disabled,
	HighPriority
}

/**
 * Base class for creating custom elements
 * */
interface ElysiaElement extends LitElement
{
	/**
	 * Schedule a possible update, if it's template values have changed.
	 * If you want to force an update, you can call requestUpdate().
	 */
	_onUpdate(): void;

	/**
	 * Set the offscreen update strategy for this element.
	 * @default OffscreenUpdateStrategy.Disabled
	 * @param strategy
	 */
	setOffscreenRenderStrategy(strategy: OffscreenUpdateStrategy): void;

	/**
	 * The scheduler that this element is subscribed to.
	 */
	scheduler: Scheduler;

	/**
	 * Lifecycle hook that is called when the element is mounted to the DOM.
	 */
	onMount?(): void;

	/**
	 * Lifecycle hook that is called before the element is updated.
	 */
	onBeforeUpdate?(): void;

	/**
	 * Lifecycle hook that returns a UI result.
	 */
	onRender(): TemplateResult;

	/**
	 * Lifecycle hook that is called after the element is updated.
	 */
	onAfterUpdate?(): void;

	/**
	 * Lifecycle hook that is called when the element is unmounted from the DOM.
	 */
	onUnmount?(): void;
}

class ElysiaElement extends LitElement
{
	public static Tag: string = "unknown-elysia-element";

	public static ManualTracking = false;

	public scheduler: Scheduler = defaultScheduler;

	public get offscreen(): boolean { return this.#offscreen; }

	public get offscreenUpdateStrategy(): OffscreenUpdateStrategy { return this.#offscreenUpdateStrategy; }

	public constructor()
	{
		super();
		this.compareRenderOutput = this.compareRenderOutput.bind(this);
		this._onUpdate = this._onUpdate.bind(this);
		this.setOffscreenRenderStrategy = this.setOffscreenUpdateStrategy.bind(this);
		this.onRender = this.onRender.bind(this);
	}

	override firstUpdated()
	{
		super.firstUpdated(new Map);

		this.onMount && this.onMount();

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

	override disconnectedCallback(): void
	{
		super.disconnectedCallback();
		this.scheduler.unsubscribe(this);
		this.componentVisibilityObserver?.disconnect();
		this.onUnmount && this.onUnmount();
	}

	public _onUpdate()
	{
		if(this.isUpdatePending) return;

		for(const field of this.fieldsToCheck)
		{
			if(field == 'onRender')
			{
				const currentRender = this.onRender();

				if (isLitTemplateResult(currentRender))
				{
					if (
						!this.#renderResult
						|| this.compareRenderOutput(this.#renderResult.values, currentRender.values)
						|| this.compareRenderOutput(this.#renderResult.strings, currentRender.strings)
					)
					{
						this.#renderResult = currentRender;
						this.requestUpdate();
						this.onBeforeUpdate && this.onBeforeUpdate();
					}
				}
				else { throw Error("ImHTML render method must return a lit-html template result"); }
			}
			else
			{
				// @ts-ignore
				if(this[field] !== this[`_elysia_internal_${field}`])
				{
					// @ts-ignore
					this[`_elysia_internal_${field}`] = this[field];
					this.requestUpdate();
					this.onBeforeUpdate && this.onBeforeUpdate();
					break;
				}
			}
		}
	}

	public setOffscreenUpdateStrategy(value: OffscreenUpdateStrategy)
	{
		this.#offscreenUpdateStrategy = value;

		if(this.offscreen)
		{
			if(value === OffscreenUpdateStrategy.Disabled) this.scheduler.unsubscribe(this);
			if(value === OffscreenUpdateStrategy.HighPriority) this.scheduler.subscribe(this);
		}
	}

	override render(): TemplateResult { return this.#renderResult ?? this.onRender(); }

	protected componentVisibilityObserver?: IntersectionObserver;

	// @ts-ignore
	protected fieldsToCheck: string[] = [!this.constructor.ManualTracking && "onRender"].filter(Boolean);

	protected override updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void
	{
		super.updated(_changedProperties);
		this.onAfterUpdate && this.onAfterUpdate();
	}

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
			if (isLitTemplateResult(prev) && isLitTemplateResult(next))
			{
				return this.compareRenderOutput(prev.values, next.values) && this.compareRenderOutput(prev.strings, next.strings);
			}

			// arrays are deeply compared
			if (Array.isArray(prev) && Array.isArray(next)) return this.compareRenderOutput(prev, next);

			// strict equality check
			if (a[i] !== b[i]) return true;
		}

		return false;
	}

	#renderResult?: TemplateResult;

	#offscreen = true;

	#offscreenUpdateStrategy: OffscreenUpdateStrategy = OffscreenUpdateStrategy.Disabled;
}

export function BooleanConverter(val: any): boolean
{
	if(val && val !== "false") return true;
	return val === "";
}
