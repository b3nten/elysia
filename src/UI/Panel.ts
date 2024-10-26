import { css, defineComponent, ElysiaElement, html, track } from "./UI.ts";
import { query } from "lit/decorators.js"
import { ReactiveController, ReactiveControllerHost } from "lit";
import { ref, type Ref } from "lit/directives/ref.js"
import "./Widgets.ts";
import type { CSSResult } from "../../../../Library/Caches/deno/npm/registry.npmjs.org/@lit/reactive-element/2.0.4/development/css-tag.d.ts";
import type { TemplateResult } from "../../../../Library/Caches/deno/npm/registry.npmjs.org/lit-element/4.1.1/development/lit-element.d.ts";

export class DraggableController implements ReactiveController
{
	mouseDown = false;
	dragging = false;

	start = { x: 0, y: 0 };
	offset = { x: 0, y: 0 };
	last = { x: 0, y: 0 };

	x = 0;
	y = 0;

	constructor(private host: HTMLElement & ReactiveControllerHost)
	{
		host.addController(this);
		this.bindHandle = this.bindHandle.bind(this);
		this.hostConnected = this.hostConnected.bind(this);
		this.hostDisconnected = this.hostDisconnected.bind(this);
		this.hostUpdated = this.hostUpdated.bind(this);
	}

	public bindHandle(): Ref
	{
		return ref((childContainer) => {
			if (!childContainer) return;
			this.#handle = childContainer as HTMLElement;
		}) as Ref;
	}

	public hostConnected(): void { window.addEventListener("resize", this.#onWindowResize); }

	public hostDisconnected(): void { window.removeEventListener("resize", this.#onWindowResize); }

	public hostUpdated(): void { this.#handle?.addEventListener("mousedown", this.#onDragStart); }

	accessor #handle: HTMLElement | undefined;

	#onDragStart = (e: MouseEvent) =>
	{
		this.mouseDown = true;

		this.offset = {
			x: e.clientX - this.x,
			y: e.clientY - this.y,
		};

		this.start = {
			x: e.clientX - this.offset.x,
			y: e.clientY - this.offset.y,
		};

		window.addEventListener("mousemove", this.#onDragMove);
		window.addEventListener("mouseup", this.#onDragEnd);
	};

	#onDragMove = (e: MouseEvent) =>
	{
		if (!this.mouseDown) return;
		if (!this.dragging) this.dragging = true;
		// want to constrain the s_Parent bounds to the window
		const bounds = this.host.getBoundingClientRect();
		const x = Math.max(0, Math.min(e.clientX - this.offset.x, window.innerWidth - bounds.width));
		const y = Math.max(0, Math.min(e.clientY - this.offset.y, window.innerHeight - bounds.height));
		this.x = x;
		this.y = y;
		this.last = { x, y };
		this.host.style.transform = `translate(${this.x}px, ${this.y}px)`;
	};

	#onDragEnd = () =>
	{
		this.dragging = false;
		this.mouseDown = false;

		window.removeEventListener("mousemove", this.#onDragMove);
		window.removeEventListener("mouseup", this.#onDragEnd);
	};

	#onWindowResize = () =>
	{
		const bounds = this.host.getBoundingClientRect();
		const x = Math.max(0, Math.min(this.last.x, window.innerWidth - bounds.width));
		const y = Math.max(0, Math.min(this.last.y, window.innerHeight - bounds.height));
		this.x = x;
		this.y = y;
		this.host.style.transform = `translate(${this.x}px, ${this.y}px)`;
	}
}

export class CollapsableController implements ReactiveController
{

	isOpen = true;

	constructor(private host: ReactiveControllerHost & HTMLElement)
	{
		host.addController(this);
		this.hostConnected = this.hostConnected.bind(this);
		this.bindTrigger = this.bindTrigger.bind(this);
		this.bindContainer = this.bindContainer.bind(this);
		this.open = this.open.bind(this);
		this.close = this.close.bind(this);
		this.toggle = this.toggle.bind(this);
	}

	hostConnected(): void {}

	bindTrigger(): Ref
	{
		return ref((trigger) => {
			if(!trigger) return;
			this.#trigger = trigger as HTMLElement;
			this.#trigger.addEventListener("mousedown", this.#onMouseDown);
			this.#trigger.addEventListener("mouseup", this.#onMouseUp);
		}) as Ref;
	}

	bindContainer(): Ref
	{
		return ref((container) => {
			if(!container) return;
			this.#container = container as HTMLElement;
		}) as Ref;
	}

	open({immediate = false} = {})
	{
		if(this.isOpen) return;

		const oldRootHeight = this.host.getBoundingClientRect().height;
		this.host.style.height = `auto`;
		const newRootHeight = this.host.getBoundingClientRect().height;

		const anim = this.host.animate(
			{ height: [`${oldRootHeight}px`,`${newRootHeight}px`] },
			{
				duration: immediate ? 0 : (newRootHeight - oldRootHeight) * .5,
				easing: "ease-in-out",
				fill: "forwards",
			},
		);

		anim.finished.then(() => {
			anim.commitStyles();
			anim.cancel();
			this.isOpen = true;
		})
	}

	close({immediate = false} = {})
	{
		if(!this.isOpen) return;

		const oldRootHeight = this.host!.getBoundingClientRect().height;
		const containerDisplay = this.#container!.style.display;
		this.#container!.style.display = "none";
		this.host!.style.height = 'auto';
		const newRootHeight = this.host!.getBoundingClientRect().height;
		this.#container!.style.display = containerDisplay;

		const anim = this.host!.animate(
			{ height: [`${oldRootHeight}px`,`${newRootHeight}px`] },
			{
				duration: immediate ? 0 : (oldRootHeight - newRootHeight) * .5,
				easing: "ease-in-out",
				fill: "forwards",
			},
		);

		anim.finished.then(() => {
			anim.commitStyles();
			anim.cancel();
			this.isOpen = false;
		})

	}

	toggle({immediate = false} = {})
	{
		if(this.isOpen) this.close({ immediate });
		else this.open({ immediate });
	}

	#container: HTMLElement | undefined;

	#trigger: HTMLElement | undefined;

	#startPosition = { x: 0, y: 0 };

	#onMouseDown = (e: MouseEvent) => { this.#startPosition = { x: e.clientX, y: e.clientY }; }

	#onMouseUp = (e: MouseEvent) =>
	{
		if (this.#startPosition.x !== e.clientX || this.#startPosition.y !== e.clientY) return;
		this.toggle();
	}
}

export class ElysiaFloatingPanel extends ElysiaElement
{
	static override Tag = 'elysia-floating-panel';

	static override styles: CSSResult = css`
		:host {
            position: fixed;
			top: 24px;
			right: 24px;
			background: var(--elysia-color-nosferatu);
			border: 1px solid var(--elysia-color-voncount);
			color: var(--elysia-color-cullen);
			border-radius: 4px;
			z-index: 1000;
			overflow: hidden;
            min-width: 300px;
			font-family: var(--elysia-font-family);
			filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
		}

		.header {
			background: var(--elysia-color-aro);
			color: var(--elysia-color-purple);
			padding: 8px;
			user-select: none;
            -webkit-user-select: none;
			cursor: grab;
		}

		.body {
			padding: 8px;
			max-height: 85vh;
			overflow: scroll;
		}
	`

	@query('.header') accessor header: Element | null = null;

	dragger: DraggableController;

	dropper: CollapsableController;

	constructor() {
		super();
		this.dragger = new DraggableController(this);
		this.dropper = new CollapsableController(this);
	}

	public override onRender(): TemplateResult
	{
		return html`
			<div
				class="header"
				${this.dragger.bindHandle()}
				${this.dropper.bindTrigger()}
			>
				<slot name="header"></slot>
			</div>
			<div
				class="body"
				${this.dropper.bindContainer()}
			>
				<slot name="body"></slot>
			</div>
		`
	}
}

defineComponent(ElysiaFloatingPanel);


export class ElysiaFloatingPanelTest extends ElysiaElement
{
	static override Tag = 'elysia-floating-panel-test';

	static override styles: CSSResult = css`
		.header {

		}
		.body {
			display: flex;
			flex-direction: column;
			gap: 1em;
		}
	`

	vec = { x: 4, y: 2 };

	number = 5;

	bool = true;

	public override onRender(): TemplateResult
	{
		return html`
			<elysia-floating-panel>
				<div class="header" slot="header">Header</div>
				<div class="body" slot="body">
					<elysia-button @click=${() => console.log("clicked")}>Click me</elysia-button>
					<elysia-number-input .value=${this.number}></elysia-number-input>
					<elysia-text-input>hello world</elysia-text-input>
					<elysia-boolean @_change=${(e: any) => this.bool = e.detail} _value=${this.bool}></elysia-boolean>
					<elysia-range></elysia-range>
					<elysia-vector .value=${this.vec} @change=${(v: any) => this.vec = v.detail}></elysia-vector>
					<elysia-enum></elysia-enum>
					<elysia-color-picker></elysia-color-picker>
				</div>
			</elysia-floating-panel>
		`
	}
}

defineComponent(ElysiaFloatingPanelTest);
