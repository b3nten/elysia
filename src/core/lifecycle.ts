import { Actor } from "./actor.ts";
import {
	ELYSIA_ASSERT_INTERNAL,
	ELYSIA_INTERNAL,
} from "./internal.ts";
import type { Constructor } from "../util/types.ts";
import { Application } from "./application.ts";
import type { Component } from "./component.ts";

export interface IDestructible {
	destructor?(): void;
}

export enum ObjectState {
	Inactive,
	Active,
	Destroyed,
}

export interface IObject extends Object, IDestructible {
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
}

export let startActor = (actor: Actor & IObject) => {
	ELYSIA_DEV: ELYSIA_ASSERT_INTERNAL(actor);
	if(
		actor.parent
		&& actor.parent[ELYSIA_INTERNAL].state === ObjectState.Active
	) {
		actor.onStartup?.();
		actor[ELYSIA_INTERNAL].state = ObjectState.Active;
		for(let component of actor.components.values())
			startComponent(component);
		for(let child of actor.children)
			startActor(child);
	}
}

export let startComponent = (component: IObject) => {
	ELYSIA_DEV: ELYSIA_ASSERT_INTERNAL(component);

	if(component[ELYSIA_INTERNAL].state === ObjectState.Inactive) {
		component[ELYSIA_INTERNAL].state = ObjectState.Active;
		component.onStartup?.();
	}
}

export let preUpdateActor = (actor: Actor & IObject, delta: number, elapsed: number, resize: boolean, width: number, height: number) => {
	ELYSIA_DEV: ELYSIA_ASSERT_INTERNAL(actor);

	if(actor[ELYSIA_INTERNAL].state === ObjectState.Active) {
		if(resize) {
			actor.onResize?.(delta, elapsed);
		}


		if(actor[ELYSIA_INTERNAL].transformIsDirty)
			callTransformChanged(actor);

		actor.onBeforeUpdate?.(delta, elapsed);

		for(let component of actor.components.values())
			preUpdateComponent(component, delta, elapsed, resize, width, height);

		for(let child of actor.children)
			preUpdateActor(child, delta, elapsed, resize, width, height);
	}
}

export let preUpdateComponent = (component: IObject, delta: number, elapsed: number, resize: boolean, width: number, height: number) => {
	ELYSIA_DEV: ELYSIA_ASSERT_INTERNAL(component);

	if(component[ELYSIA_INTERNAL].state === ObjectState.Active) {
		if(resize) {
			component.onResize?.(width, height);
		}

		component.onBeforeUpdate?.(delta, elapsed);
	}
}

export let mainUpdateActor = (actor: Actor & IObject, delta: number, elapsed: number) => {
	ELYSIA_DEV: ELYSIA_ASSERT_INTERNAL(actor);

	if(actor[ELYSIA_INTERNAL].state === ObjectState.Active) {
		actor.onUpdate?.(delta, elapsed);
		for(let component of actor.components.values()) {
			mainUpdateComponent(component, delta, elapsed);
		}
		for(let child of actor.children) {
			mainUpdateActor(child, delta, elapsed);
		}
	}
}

export let mainUpdateComponent = (component: IObject, delta: number, elapsed: number) => {
	ELYSIA_DEV: ELYSIA_ASSERT_INTERNAL(component);

	if(component[ELYSIA_INTERNAL].state === ObjectState.Active) {
		component.onUpdate?.(delta, elapsed);
	}
}

export let postUpdateActor = (actor: Actor & IObject, delta: number, elapsed: number) => {
	ELYSIA_DEV: ELYSIA_ASSERT_INTERNAL(actor);

	if(actor[ELYSIA_INTERNAL].state === ObjectState.Active) {
		actor.onAfterUpdate?.(delta, elapsed);
		for(let component of actor.components.values()) {
			postUpdateComponent(component, delta, elapsed);
		}
		for(let child of actor.children) {
			postUpdateActor(child, delta, elapsed);
		}
	}
}

export let postUpdateComponent = (component: IObject, delta: number, elapsed: number) => {
	ELYSIA_DEV: ELYSIA_ASSERT_INTERNAL(component);
	if(component[ELYSIA_INTERNAL].state === ObjectState.Active) {
		component.onAfterUpdate?.(delta, elapsed);
	}
}

export let resizeActor = (actor: Actor & IObject, width: number, height: number) => {
	ELYSIA_DEV: ELYSIA_ASSERT_INTERNAL(actor);
	actor.onResize?.(width, height);
	if(!actor.destroyed) {
		for(let component of actor.components.values()) {
			resizeComponent(component, width, height);
		}
		for(let child of actor.children) {
			resizeActor(child, width, height);
		}
	}
}

export let resizeComponent = (component: IObject, width: number, height: number) => {
	ELYSIA_DEV: ELYSIA_ASSERT_INTERNAL(component);
	if(component[ELYSIA_INTERNAL].state !== ObjectState.Destroyed) {
		component.onResize?.(width, height);
	}
}

export let reparentActor = (actor: Actor & IObject, parent: Actor | null) => {
	ELYSIA_DEV: ELYSIA_ASSERT_INTERNAL(actor);

	if(actor[ELYSIA_INTERNAL].parent) {
		actor[ELYSIA_INTERNAL].parent[ELYSIA_INTERNAL].children.delete(actor)
	}

	if(parent) {
		parent[ELYSIA_INTERNAL].children.add(actor);
		actor[ELYSIA_INTERNAL].parent = parent;
		Application.scene[ELYSIA_INTERNAL].actorsByType.get(actor.constructor as Constructor<Actor>).add(actor);
	} else {
		Application.scene[ELYSIA_INTERNAL].actorsByType.get(actor.constructor as Constructor<Actor>).delete(actor);
		actor[ELYSIA_INTERNAL].parent = null;
	}
}

export let reparentComponent = (component: Component, parent: Actor | null) => {
	ELYSIA_DEV: ELYSIA_ASSERT_INTERNAL(component);

	let ctor = component[ELYSIA_INTERNAL].ctor;

	if(component[ELYSIA_INTERNAL].parent) {
		component[ELYSIA_INTERNAL].parent[ELYSIA_INTERNAL].components.delete(ctor);
	}

	if(parent) {
		parent[ELYSIA_INTERNAL].components.set(ctor, component);
		component[ELYSIA_INTERNAL].parent = parent;
		Application.scene[ELYSIA_INTERNAL].componentsByType.get(ctor).add(component);
	} else {
		Application.scene[ELYSIA_INTERNAL].componentsByType.get(ctor).delete(component);
		component[ELYSIA_INTERNAL].parent = null;
	}
}

export let shutdownActor = (actor: Actor & IObject) => {
	ELYSIA_DEV: ELYSIA_ASSERT_INTERNAL(actor);

	if(actor[ELYSIA_INTERNAL].state === ObjectState.Active) {
		for(let component of actor.components.values()) {
			shutdownComponent(component);
		}
		for(let child of actor.children) {
			shutdownActor(child);
		}
		actor.onShutdown?.();
		actor[ELYSIA_INTERNAL].state = ObjectState.Inactive;
	}
}

export let shutdownComponent = (component: IObject) => {
	ELYSIA_DEV: ELYSIA_ASSERT_INTERNAL(component);

	if(component[ELYSIA_INTERNAL].state === ObjectState.Active) {
		component.onShutdown?.();
		component[ELYSIA_INTERNAL].state = ObjectState.Inactive;
	}
}

export let destroyActor = (actor: Actor & IObject, callDestructor = true) => {
	ELYSIA_DEV: ELYSIA_ASSERT_INTERNAL(actor);

	if(actor[ELYSIA_INTERNAL].state !== ObjectState.Destroyed) {
		for(let component of actor.components.values()) {
			destroyComponent(component);
		}

		for(let child of actor.children) {
			destroyActor(child);
		}

		shutdownActor(actor);
		reparentActor(actor, null);

		actor[ELYSIA_INTERNAL].state = ObjectState.Destroyed;
		actor[ELYSIA_INTERNAL].parent = null;
		actor[ELYSIA_INTERNAL].children.clear();
		actor[ELYSIA_INTERNAL].components.clear();
		actor[ELYSIA_INTERNAL].localMatrix.identity();
		actor[ELYSIA_INTERNAL].worldMatrix.identity();
		actor[ELYSIA_INTERNAL].boundingBox.reset();
		actor[ELYSIA_INTERNAL].boundingSphere.reset();
		actor[ELYSIA_INTERNAL].position.onChange = null;
		actor[ELYSIA_INTERNAL].rotation.onChange = null;
		actor[ELYSIA_INTERNAL].scale.onChange = null;
	}
}

export let destroyComponent = (component: Component) => {
	ELYSIA_DEV: ELYSIA_ASSERT_INTERNAL(component);

	if(component[ELYSIA_INTERNAL].state !== ObjectState.Destroyed) {
		shutdownComponent(component);
		reparentComponent(component, null);
		component[ELYSIA_INTERNAL].state = ObjectState.Destroyed;
	}
}

export let callTransformChanged = (entity: IObject) => {
	ELYSIA_DEV: ELYSIA_ASSERT_INTERNAL(entity);

	if(Actor.IsActor(entity) && !entity.destroyed) {
		entity.onTransformChanged?.();
		entity[ELYSIA_INTERNAL].transformIsDirty = false;
		for(let component of entity.components.values()) {
			callTransformChanged(component);
		}
		for(let child of entity.children) {
			callTransformChanged(child);
		}
	} else if (entity[ELYSIA_INTERNAL].state === ObjectState.Active) {
		entity.onTransformChanged?.();
	}
}