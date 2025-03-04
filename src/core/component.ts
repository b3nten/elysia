import { type IObject, ObjectState } from "./lifecycle.ts";
import type { Actor } from "./actor.ts";
import { Application } from "./application.ts";
import { ELYSIA_INTERNAL } from "./internal.ts";

export interface IComponent extends IObject {}

export class Component implements IComponent {

	static IsComponent(a: any): a is Component & IComponent {
		return a.isComponent;
	}

	get isComponent() {
		return true;
	}

	get inactive() {
		return this[ELYSIA_INTERNAL].state === ObjectState.Inactive
	}

	get active() {
		return this[ELYSIA_INTERNAL].state === ObjectState.Active;
	}

	get destroyed() {
		return this[ELYSIA_INTERNAL].state === ObjectState.Destroyed;
	}

	get valid() {
		return this[ELYSIA_INTERNAL].state !== ObjectState.Destroyed;
	}

	get parent(): Actor | null {
		return this[ELYSIA_INTERNAL].parent;
	}

	remove() {
		if(this.parent) {
			this.parent.removeComponent(this);
		}
	}

	protected get app() {
		return Application.instance;
	}

	protected get scene() {
		return Application.scene;
	}

	protected get renderer() {
		return Application.renderer;
	}

	[ELYSIA_INTERNAL] = {
		parent: null as Actor | null,
		state: ObjectState.Inactive,
		// Can use this class's constructor as the instance constructor
		// unlike objects that are constructed via {} or new Object
		noCtor: false,
	}
}
