import { destroyComponent, type IObject, ObjectState } from "./lifecycle.ts";
import type { Actor } from "./actor.ts";
import { Application } from "./application.ts";
import { ELYSIA_INTERNAL, ElysiaIObjectInternalProperties } from "./internal.ts";

export class Component implements IObject {

	static IsComponent(a: any): a is Component {
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

	onStartup?(): void;
	onBeforeUpdate?(delta: number, elapsed: number): void;
	onUpdate?(delta: number, elapsed: number): void;
	onAfterUpdate?(delta: number, elapsed: number): void;
	onShutdown?(): void;
	onParent?(parent: IObject): void;
	onResize?(width: number, height: number): void;
	onSiblingAdded?(sibling: IObject): void;
	onSiblingRemoved?(sibling: IObject): void;
	onTransformChanged?(): void;

	remove() {
		if(this.parent) {
			this.parent.removeComponent(this);
		}
	}

	addTag(tag: any) {
		this[ELYSIA_INTERNAL].tags.add(tag);
		if(this.parent) {
			this.parent[ELYSIA_INTERNAL].childrenByTag.get(tag).add(this);
			this.scene[ELYSIA_INTERNAL].tags.get(tag).add(this);
		}
	}

	removeTag(tag: any) {
		this[ELYSIA_INTERNAL].tags.delete(tag);
		if(this.parent) {
			this.parent[ELYSIA_INTERNAL].childrenByTag.get(tag).delete(this);
			this.scene[ELYSIA_INTERNAL].tags.get(tag).delete(this);
		}
	}

	destructor() {
		destroyComponent(this);
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

	[ELYSIA_INTERNAL] = new ElysiaIObjectInternalProperties(this.constructor)
}

