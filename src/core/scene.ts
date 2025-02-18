import {type IComponent, TagSystem} from "./IComponent.ts";
import type { Destructible } from "./lifecycle.ts";
import type {Constructor} from "../../__src/Shared/Utilities.ts";
import {elysiaLogger} from "./logger.ts";

export const SCENE_INIT_AND_RUN = Symbol.for("Elysia::Scene::InitAndRun");
export const SCENE_UPDATE = Symbol.for("Elysia::Scene::Update");
export const SCENE_END = Symbol.for("Elysia::Scene::End");

type UnwrapComponent<
	T extends IComponent | Constructor<IComponent>
> = T extends Constructor<IComponent> ? InstanceType<T> : T;

export class Scene implements Destructible {

	readonly components = new Set<IComponent>

	getComponentsWithTag(tag: any) {
		return this._tags.getComponentsWithTag(tag);
	}

	getComponentsWithTags(out: Set<IComponent>, ...tags: any[]) {
		return this._tags.getComponentsWithTags(out, ...tags);
	}

	addComponentToScene<
		T extends IComponent | Constructor<IComponent, Args>,
		Args extends any[]
	>(component: T, ...args: Args): UnwrapComponent<T> {
		let c: IComponent = typeof component === "function" ? new component(...args) : component;
		// instantiate component with lifecycle hooks
		// set the component constructor as a tag on this actor
		return c as UnwrapComponent<T>;
	}

	removeComponentFromScene(component: IComponent) {
		// need to do something...
		// remove the component from the actor
		// remove the component constructor as a tag on this actor
	}

	destructor() {
		this[SCENE_END]();
		this.components.clear();
		this._tags.clear();
		this._destroyed = true;
	}

	protected onLoad?(): void | Promise<void>;
	protected onStart?(): void;
	protected onUpdate?(): void;
	protected onEnd?(): void;

	async [SCENE_INIT_AND_RUN]() {
		ELYSIA_DEV: {
			if(this._started) {
				throw Error(
					`Attempting to call [SCENE_INIT_AND_RUN] on a Scene that has already started.
					 Unless you are manually calling this method, this is likely a bug.`
				);
			}
			if(this._destroyed) {
				throw Error(
					`Attempting to call [SCENE_INIT_AND_RUN] on a Scene that has been destroyed.
					 Unless you are manually calling this method, this is likely a bug.`
				);
			}

			try {
				await this.onLoad?.();
			} catch(e) {
				throw Error('Error during Scene onLoad', { cause: e });
			}

			this._started = true;

			try {
				this.onStart?.();
			} catch(e) {
				throw Error('Error during Scene onStart', { cause: e });
			}

			// loop through all components and call their onStart methods
		}
		ELYSIA_PROD: {
			await this.onLoad?.();
			this._started = true;
			this.onStart?.();
			// loop through all components and call their onStart methods
		}
	}

	[SCENE_UPDATE]() {
		ELYSIA_DEV: {
			if(!this._started) {
				throw Error(
					`Attempting to call [SCENE_UPDATE] on a Scene that has not been started.
					 Unless you are manually calling this method, this is likely a bug.`
				);
			}
			if(this._destroyed) {
				throw Error(
					`Attempting to call [SCENE_UPDATE] on a Scene that has been destroyed.
					 Unless you are manually calling this method, this is likely a bug.`
				);
			}
			try {
				this.onUpdate();
			} catch(e) {
				throw Error('Error during Scene onUpdate', { cause: e });
			}
			// loop through all components and call their onUpdate methods
		}
		ELYSIA_PROD: {
			this.onUpdate();
			// loop through all components and call their onUpdate methods
		}
	}

	[SCENE_END]() {
		ELYSIA_DEV: {
			let errs: Error[] = [];

			if(this._destroyed) {
				throw Error(
					`Attempting to call [SCENE_END] on a Scene that has already been destroyed.
					 Unless you are manually calling this method, this is likely a bug.`
				);
			}
			try {
				this.onEnd?.();
			} catch(e) {
				errs.push(Error('Error during Scene onEnd', { cause: e }))
			}
			// loop through all components and call their onEnd methods

			// handle errors
			if(errs.length > 0) {
				throw Error('Errors during Scene onEnd', { cause: errs });
			}
		}
		ELYSIA_PROD: {
			let errs: Error[] = [];
			try {
				this.onEnd?.();
			} catch(e) {
				errs.push(Error('Error during Scene onEnd', { cause: e }))
			}
			this.onEnd?.();
			// loop through all components and call their onEnd methods
			if(errs.length > 0) {
				throw Error('Errors during Scene onEnd', { cause: errs });
			}
		}
	}

	protected _tags = new TagSystem;
	protected _started = false;
	protected _destroyed = false;
}


console.error("An error occured")
console.group()
console.error("An error occured")
console.group()
console.error("An error occured")
console.groupEnd();
console.groupEnd();
