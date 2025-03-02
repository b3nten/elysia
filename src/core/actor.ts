import { type IComponent, TagSystem } from "./IComponent.ts";
import type { Constructor } from "../util/types.ts";
import { Vector3, Quaternion, Matrix4, BoundingBox } from "../math/vectors.ts";
import type { IDestructible } from "./lifecycle.ts";

type UnwrapComponent<
	T extends IComponent | Constructor<IComponent>
> = T extends Constructor<IComponent> ? InstanceType<T> : T;

export const ACTOR_WORLD_MATRIX = Symbol.for("Elysia::Actor::WorldMatrix");
export const ACTOR_LOCAL_MATRIX = Symbol.for("Elysia::Actor::LocalMatrix");
export const ACTOR_WORLD_MATRIX_DIRTY = Symbol.for("Elysia::Actor::WorldMatrixDirty");
export const ACTOR_LOCAL_MATRIX_DIRTY = Symbol.for("Elysia::Actor::LocalMatrixDirty");
export const ACTOR_BOUNDING_BOX = Symbol.for("Elysia::Actor::BoundingBox");

export class Actor implements IComponent, IDestructible {

	readonly position = new Vector3();
	readonly rotation = new Quaternion();
	readonly scale = new Vector3(1, 1, 1);

	readonly components = new Set<IComponent>();

	parent?: Actor;

	get isStatic() {
		return this._isStatic;
	}

	set isStatic(value: boolean) {
		this._isStatic = value;
	}

	addTags(component: IComponent, ...tags: any[]) {
		this._tags.addComponentWithTags(component, ...tags);
	}

	removeTags(component: IComponent, ...tags: any[]) {
		this._tags.removeTagsFromComponent(component, ...tags);
	}

	getComponentsWithTag(tag: any) {
		return this._tags.getComponentsWithTag(tag);
	}

	getComponentsWithTags(out: Set<IComponent>, ...tags: any[]) {
		return this._tags.getComponentsWithTags(out, ...tags);
	}

	addComponent<
		T extends IComponent | Constructor<IComponent, Args>,
		Args extends any[]
	>(component: T, ...args: Args): UnwrapComponent<T> {
		let c: IComponent = typeof component === "function" ? new component(...args) : component;
		// instantiate component with lifecycle hooks
		// set the component constructor as a tag on this actor
		return c as UnwrapComponent<T>;
	}

	removeComponent(component: IComponent) {
		// need to do something...
		// remove the component from the actor
		// remove the component constructor as a tag on this actor
	}

	get worldMatrix(): Matrix4 {
		if(this[ACTOR_WORLD_MATRIX_DIRTY]) {
			this.updateWorldMatrix();
		}
		return this[ACTOR_WORLD_MATRIX];
	}

	get localMatrix(): Matrix4 {
		if(this[ACTOR_LOCAL_MATRIX_DIRTY]) {
			this.updateLocalMatrix();
		}
		return this[ACTOR_LOCAL_MATRIX];
	}

	constructor() {
		this.position.onChange = () => {
			this.markTransformDirty();
		}
		this.rotation.onChange = () => {
			this.markTransformDirty();
		}
	}

	destructor() {
		ELYSIA_DEV: {
			if(this._isDestroyed)
				throw Error(
					"Attempting to destroy an actor that has already been destroyed."
				);
		}
		if(this._isDestroyed) return;
		this._isDestroyed = true;
	}

	onStart?(): void;
	onPhysicsUpdate?(): void;
	onPreUpdate?(): void;
	onUpdate?(): void;
	onPostUpdate?(): void;
	onPostRender?(): void;
	onEnd?(): void;

	updateLocalMatrix() {
		this[ACTOR_LOCAL_MATRIX].compose(this.position, this.rotation, this.scale);
		this[ACTOR_LOCAL_MATRIX_DIRTY] = false;
	}

	updateWorldMatrix() {
		this.updateLocalMatrix();
		if (this.parent) {
			this[ACTOR_WORLD_MATRIX].multiplyMatrices(
				this.parent.worldMatrix,
				this[ACTOR_LOCAL_MATRIX],
			);
		} else {
			this[ACTOR_WORLD_MATRIX].copy(this[ACTOR_LOCAL_MATRIX]);
		}
		this[ACTOR_WORLD_MATRIX_DIRTY] = false;
		this[ACTOR_LOCAL_MATRIX_DIRTY] = false;
	}

	markTransformDirty() {
		this[ACTOR_LOCAL_MATRIX_DIRTY] = true;
		this[ACTOR_WORLD_MATRIX_DIRTY] = true;
		// todo: iterate children and mark all as dirty.
	}

	getBoundingBox(): BoundingBox {
		this[ACTOR_BOUNDING_BOX].reset();
		// for (const component of this.components) {
		// 	if (!isActor(component)) continue;
		// 	box.union(component.getBoundingBox());
		// }
		return this[ACTOR_BOUNDING_BOX];
	}

	protected _isStatic = false;
	protected _isActive = false;
	protected _isDestroyed = false;
	protected _tags = new TagSystem;

	[ACTOR_WORLD_MATRIX_DIRTY] = true;
	[ACTOR_LOCAL_MATRIX_DIRTY] = true;
	[ACTOR_WORLD_MATRIX] = new Matrix4;
	[ACTOR_LOCAL_MATRIX] = new Matrix4;
	[ACTOR_BOUNDING_BOX] = new BoundingBox;
}
