import type { Constructor, ReadonlyMap, ReadonlySet } from "../util/types.ts";
import { Application } from "./application.ts";
import {
	BoundingBox,
	BoundingSphere,
	Matrix4,
	Quaternion,
	Vector3,
} from "../math/vectors.ts";
import type { Component, IComponentInternals } from "./component.ts";
import { isConstructor } from "../util/asserts.ts";
import type { IBounded } from "./interfaces.ts";
import { DEV_EXCEPTION, EXCEPTION } from "../util/exceptions.ts";
import { Destructible } from "../util/destructible.ts";
import type { IConstructable } from "./new.ts";
import { elysiaLogger } from "./log.ts";

export enum ActorState {
	Inactive = 0,
	Active = 1,
	Destroyed = 2,
}

export class Actor implements IBounded, IConstructable {
	static isActorType(a: any): a is Actor {
		return true;
	}

	readonly isActor = true;

	get parent(): Actor | null {
		return this._parent;
	}

	get active() {
		return this._actorState === ActorState.Active;
	}

	get destroyed() {
		return this._actorState === ActorState.Destroyed;
	}

	get valid() {
		return this._actorState !== ActorState.Destroyed;
	}

	get components(): ReadonlyMap<Constructor<Component>, Component> {
		return this._components;
	}

	get children(): ReadonlySet<Actor> {
		return this._children;
	}

	get position() {
		return this._position;
	}

	get rotation() {
		return this._rotation;
	}

	get scale() {
		return this._scale;
	}

	get matrixWorld() {
		if (this._transformDirty) {
			this.updateMatrices();
		}
		return this._worldMatrix;
	}

	get matrix() {
		if (this._transformDirty) {
			this._localMatrix.compose(this.position, this.rotation, this.scale);
		}
		return this._localMatrix;
	}

	getBoundingBox() {
		return this._boundingBox;
	}

	getBoundingSphere() {
		return this._boundingSphere;
	}

	markTransformAsDirty = () => {
		this._transformDirty = true;
		for (let child of this._children) {
			child.markTransformAsDirty();
		}
		for (let component of this._components.values()) {
			(<IComponentInternals>(
				(<unknown>component)
			))._parentTransformChanged = true;
		}
	};

	updateMatrices() {
		this._localMatrix.compose(this.position, this.rotation, this.scale);
		if (this.parent) {
			this._worldMatrix.multiplyMatrices(this.parent.matrixWorld, this.matrix);
		} else {
			this._worldMatrix.copy(this.matrix);
		}
		this._transformDirty = false;
	}

	addComponent<T extends Component>(component: T): T {
		if (this._components.has(<Constructor<T>>component.constructor)) {
			EXCEPTION(
				"Cannot add multiple components of the same type",
				{ component, actor: this }
			)
		}

		if (component.active) {
			// parent must exist for it to be active
			(<IComponentInternals>(<unknown>component))._parent.removeComponent(
				component,
			);
		}

		this._components.set(<Constructor<T>>component.constructor, component);
		(<IComponentInternals>(<unknown>component))._parent = this;
		(<IComponentInternals>(<unknown>component))._parentTransformChanged = true;

		if (this._actorState === ActorState.Active) {
			(<IComponentInternals>(<unknown>component))._callStartup();
			this._callComponentAdded(component);
		}

		return component;
	}

	tryAddComponent<T extends Component>(component: T): T | null {
		if (this._components.has(<Constructor<T>>component.constructor)) {
			return null;
		}
		return this.addComponent(component);
	}

	getComponent<T extends Component>(ctor: Constructor<T>): T | null {
		return (this._components.get(ctor) as T) ?? null;
	}

	removeComponent<T extends Component>(ctor: Constructor<T> | T): T | null {
		let component: T | undefined = isConstructor(ctor)
			? <T>this._components.get(ctor)
			: ctor;

		if (component) {
			(<IComponentInternals>(<unknown>component))._callShutdown();
			this._components.delete(component.constructor as Constructor<Component>);
			(<IComponentInternals>(<unknown>component))._parent = null;
			this._callComponentRemoved(component);
		}

		return component;
	}

	addChild<T extends Actor>(child: T): T {
		if(!(child instanceof Actor)) {
			EXCEPTION(
				"Cannot add non-actor to actor",
				{ child, actor: this }
			)
		}

		// @ts-expect-error double check
		if(child === this) {
			EXCEPTION(
				"Cannot add actor to itself",
				{ child, actor: this }
			)
		}

		if (child.parent === this) {
			ELYSIA_DEV: elysiaLogger.warn(
				`attempted to add an Actor to its parent`,
				{
					actor: this,
					child,
				}
			)
			return child;
		}

		if (child.active) {
			(child.parent ?? this.scene).removeChild(child);
		}

		this._children.add(child);
		child._parent = this;

		if (this._actorState === ActorState.Active) {
			child._callStartup();
			this._callChildAdded(child);
		}

		return child;
	}

	removeChild<T extends Actor>(child: T): T | null {
		let removed = this._children.delete(child);
		if (removed) {
			child._callShutdown();
			(<IActorInternals>(<unknown>child))._parent = null;
			this._callChildRemoved(child);
		} else {
			ELYSIA_DEV: elysiaLogger.warn(
				`attempted to remove a child that is not a child of this Actor`,
				{
					actor: this,
					child,
				}
			)
		}
		return removed ? child : null;
	}

	dispatchComponentEvent(event: string | symbol, ...args: any[]) {
		for (let component of this.components.values()) {
			ELYSIA_DEV: try {
				component[event]?.(...args);
			} catch (e) {
				DEV_EXCEPTION(
					`component ${component.constructor.name} event handler threw an error`,
					{
						component,
						error: e,
					}
				);
			}
			ELYSIA_PROD: component[event]?.(...args);
		}
	}

	dispatchChildEvent(event: string | symbol, ...args: any[]) {
		for (let child of this.children.values()) {
			ELYSIA_DEV: try {
				child[event]?.(...args);
			} catch (e) {
				DEV_EXCEPTION(
					`child ${child.constructor.name} event handler threw an error`,
					{
						child,
						error: e,
					}
				);
			}
			ELYSIA_PROD: child[event]?.(...args);
		}
	}

	dispatchEvent(event: string | symbol, ...args: any[]) {
		this.dispatchChildEvent(event, ...args);
		this.dispatchComponentEvent(event, ...args);
	}

	destroy() {
		if (this._actorState === ActorState.Destroyed) {
			ELYSIA_DEV: elysiaLogger.warn(
				"attempted to destroy an already destroyed Actor",
				{ actor: this }
			)
			return;
		}
		if(this._actorState === ActorState.Active) {
			this._callShutdown();
		}
		Destructible.destroy(this);
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

	protected constructor() {}

	/**
	 * Called when the Actor is started up.
	 * @protected
	 */
	protected onStartup?(): void;

	/**
	 * Called before the Actor is updated.
	 * @param delta
	 * @param elapsed
	 * @protected
	 */
	protected onBeforeUpdate?(delta: number, elapsed: number): void;

	/**
	 * Called when the Actor is updated.
	 * @param delta
	 * @param elapsed
	 * @protected
	 */
	protected onUpdate?(delta: number, elapsed: number): void;

	/**
	 * Called after the Actor is updated.
	 * @param delta
	 * @param elapsed
	 * @protected
	 */
	protected onAfterUpdate?(delta: number, elapsed: number): void;

	/**
	 * Called when the Actor is shut down.
	 * @protected
	 */
	protected onShutdown?(): void;

	/**
	 * Called when the canvas is resized.
	 * This is only called if the Actor is active.
	 * @param width
	 * @param height
	 * @protected
	 */
	protected onCanvasResize?(width: number, height: number): void;

	/**
	 * Called when an Actor or Component is added to the parent Actor.
	 * This is only called if the Actor is active.
	 * @param sibling
	 * @protected
	 */
	protected onSiblingAdded?(sibling: Actor | Component): void;

	/**
	 * Called when an Actor or Component is removed from the parent Actor.
	 * This is only called if the Actor is active.
	 * @param sibling
	 * @protected
	 */
	protected onSiblingRemoved?(sibling: Actor | Component): void;

	/**
	 * Called when a child Actor is added to this.
	 * This is only called if the Actor is active.
	 * @param child
	 * @protected
	 */
	protected onChildAdded?(child: Actor): void;

	/**
	 * Called when a child Actor is removed from this.
	 * This is only called if the Actor is active.
	 * @param child
	 * @protected
	 */
	protected onChildRemoved?(child: Actor): void;

	/**
	 * Called when a Component is added to this.
	 * This is only called if the Actor is active.
	 * @param component
	 * @protected
	 */
	protected onComponentAdded?(component: Component): void;

	/**
	 * Called when a Component is removed from this.
	 * This is only called if the Actor is active.
	 * @param component
	 * @protected
	 */
	protected onComponentRemoved?(component: Component): void;

	/**
	 * Called when the world space transform is changed.
	 * This is only called if the Actor is active.
	 * @protected
	 */
	protected onTransformChanged?(): void;

	protected destructor() {}

	private _parent: Actor | null = null;
	private _actorState: ActorState = ActorState.Inactive;
	private _children: Set<Actor> = new Set();
	private _components: Map<Constructor<Component>, Component> = new Map();
	private _position = new Vector3();
	private _rotation = new Quaternion();
	private _scale = new Vector3();
	private _localMatrix = new Matrix4();
	private _worldMatrix = new Matrix4();
	private _transformDirty = true;
	private _boundingBox = new BoundingBox();
	private _boundingSphere = new BoundingSphere();

	private _callStartup(): void {
		if (this._actorState !== ActorState.Inactive) return;
		this._actorState = ActorState.Active;

		ELYSIA_DEV: DEV_CALL_LIFECYLE(this, this.onStartup)
		ELYSIA_PROD: this.onStartup?.();

		for (let component of this._components.values()) {
			ELYSIA_DEV: DEV_CALL_LIFECYLE(
				(<IComponentInternals>(<unknown>component)),
				(<IComponentInternals>(<unknown>component))._callStartup
			)
			ELYSIA_PROD: (<IComponentInternals>(<unknown>component))._callStartup();
		}

		for (let child of this._children) {
			ELYSIA_DEV: DEV_CALL_LIFECYLE(child, child._callStartup)
			ELYSIA_PROD: child._callStartup();
		}
	}

	private _callBeforeUpdate(delta: number, elapsed: number): void {
		if (this._actorState !== ActorState.Active) return;

		if (this._transformDirty) {
			this._transformDirty = false;
			ELYSIA_DEV: DEV_CALL_LIFECYLE(
				this,
				this.onTransformChanged
			)
			ELYSIA_PROD: this.onTransformChanged?.();
		}

		ELYSIA_DEV: DEV_CALL_LIFECYLE(this, this.onBeforeUpdate, delta, elapsed)
		ELYSIA_PROD: this.onBeforeUpdate?.(delta, elapsed);

		for (let component of this._components.values()) {
			ELYSIA_DEV: DEV_CALL_LIFECYLE(
				(<IComponentInternals>(<unknown>component)),
				(<IComponentInternals>(<unknown>component))._callBeforeUpdate,
				delta,
				elapsed
			)
			ELYSIA_PROD: (<IComponentInternals>(
				(<unknown>component)
			))._callBeforeUpdate(delta, elapsed);
		}

		for (let child of this._children) {
			ELYSIA_DEV: DEV_CALL_LIFECYLE(child, child._callBeforeUpdate, delta, elapsed)
			ELYSIA_PROD: child._callBeforeUpdate(delta, elapsed);
		}
	}

	private _callUpdate(delta: number, elapsed: number): void {
		if (this._actorState !== ActorState.Active) return;

		ELYSIA_DEV: DEV_CALL_LIFECYLE(
			this,
			this.onUpdate,
			delta,
			elapsed
		)
		ELYSIA_PROD: this.onUpdate?.(delta, elapsed);

		for (let component of this._components.values()) {
			ELYSIA_DEV: DEV_CALL_LIFECYLE(
				(<IComponentInternals>(<unknown>component)),
				(<IComponentInternals>(<unknown>component))._callUpdate,
				delta,
				elapsed
			)
			ELYSIA_PROD: (<IComponentInternals>(<unknown>component))._callUpdate(
				delta,
				elapsed,
			);
		}

		for (let child of this._children) {
			ELYSIA_DEV: DEV_CALL_LIFECYLE(child, child._callUpdate, delta, elapsed)
			ELYSIA_PROD: child._callUpdate(delta, elapsed);
		}
	}

	private _callAfterUpdate(delta: number, elapsed: number): void {
		if (this._actorState !== ActorState.Active) return;

		ELYSIA_DEV: DEV_CALL_LIFECYLE(
			this,
			this.onAfterUpdate,
			delta,
			elapsed
		)
		ELYSIA_PROD: this.onAfterUpdate?.(delta, elapsed);

		for (let component of this._components.values()) {
			ELYSIA_DEV: DEV_CALL_LIFECYLE(
				(<IComponentInternals>(<unknown>component)),
				(<IComponentInternals>(<unknown>component))._callAfterUpdate,
				delta,
				elapsed
			)
			ELYSIA_PROD: (<IComponentInternals>(<unknown>component))._callAfterUpdate(
				delta,
				elapsed,
			);
		}

		for (let child of this._children) {
			ELYSIA_DEV: DEV_CALL_LIFECYLE(
				child,
				child._callAfterUpdate,
				delta,
				elapsed
			)
			ELYSIA_PROD: child._callAfterUpdate(delta, elapsed);
		}
	}

	private _callShutdown(): void {
		if (this._actorState !== ActorState.Active) return;
		this._actorState = ActorState.Destroyed;

		for (let component of this._components.values()) {
			ELYSIA_DEV: DEV_CALL_LIFECYLE(
				(<IComponentInternals>(<unknown>component)),
				(<IComponentInternals>(<unknown>component))._callShutdown
			)
			ELYSIA_PROD: (<IComponentInternals>(<unknown>component))._callShutdown();
		}

		for (let child of this._children) {
			ELYSIA_DEV: DEV_CALL_LIFECYLE(child, child._callShutdown);
			ELYSIA_PROD: child._callShutdown();
		}

		ELYSIA_DEV: DEV_CALL_LIFECYLE(this, this.onShutdown)
		ELYSIA_PROD: this.onShutdown?.();
	}

	private _callCanvasResize(width: number, height: number): void {
		if (this._actorState !== ActorState.Active) return;

		ELYSIA_DEV: DEV_CALL_LIFECYLE(
			this,
			this.onCanvasResize,
			width,
			height
		)
		ELYSIA_PROD: this.onCanvasResize?.(width, height);
	}

	private _callSiblingAdded(sibling: Actor | Component): void {
		if (this._actorState !== ActorState.Active) return;

		ELYSIA_DEV: DEV_CALL_LIFECYLE(
			this,
			this.onSiblingAdded,
			sibling
		)
		ELYSIA_PROD: this.onSiblingAdded?.(sibling);
	}

	private _callSiblingRemoved(sibling: Actor | Component): void {
		if (this._actorState !== ActorState.Active) return;

		ELYSIA_DEV: DEV_CALL_LIFECYLE(
			this,
			this.onSiblingRemoved,
			sibling
		)
		ELYSIA_PROD: this.onSiblingRemoved?.(sibling);
	}

	private _callChildAdded(child: Actor): void {
		if (this._actorState !== ActorState.Active) return;

		ELYSIA_DEV: DEV_CALL_LIFECYLE(
			this,
			this.onChildAdded,
			child
		)

		ELYSIA_PROD: this.onChildAdded?.(child);

		for (let component of this._components.values()) {
			ELYSIA_DEV: DEV_CALL_LIFECYLE(
				(<IComponentInternals>(<unknown>component)),
				(<IComponentInternals>(<unknown>component))._callSiblingAdded,
				child
			)
			ELYSIA_PROD: (<IComponentInternals>(
				(<unknown>component)
			))._callSiblingAdded(child);
		}

		for (let sibling of this._children) {
			ELYSIA_DEV: DEV_CALL_LIFECYLE(
				sibling,
				sibling._callSiblingAdded,
				child
			)
			ELYSIA_PROD: sibling._callSiblingAdded(child);
		}
	}

	private _callChildRemoved(child: Actor): void {
		if (this._actorState !== ActorState.Active) return;

		ELYSIA_DEV: DEV_CALL_LIFECYLE(this, this.onChildRemoved, child);
		ELYSIA_PROD: this.onChildRemoved?.(child);

		for (let component of this._components.values()) {
			ELYSIA_DEV: DEV_CALL_LIFECYLE(
				(<IComponentInternals>(<unknown>component)),
				(<IComponentInternals>(<unknown>component))._callSiblingRemoved,
				child
			)
			ELYSIA_PROD: (<IComponentInternals>(
				(<unknown>component)
			))._callSiblingRemoved(child);
		}

		for (let sibling of this._children) {
			ELYSIA_DEV: DEV_CALL_LIFECYLE(sibling, sibling._callSiblingRemoved, child);
			ELYSIA_PROD: sibling._callSiblingRemoved(child);
		}
	}

	private _callComponentAdded(component: Component): void {
		if (this._actorState !== ActorState.Active) return;

		ELYSIA_DEV: DEV_CALL_LIFECYLE(this, this.onComponentAdded, component);
		ELYSIA_PROD: this.onComponentAdded?.(component);

		for (let childComponent of this._components.values()) {
			ELYSIA_DEV: DEV_CALL_LIFECYLE(
				(<IComponentInternals>(<unknown>childComponent)),
				(<IComponentInternals>(<unknown>childComponent))._callSiblingAdded,
				component
			)
			ELYSIA_PROD: (<IComponentInternals>(
				(<unknown>childComponent)
			))._callSiblingAdded(component);
		}

		for (let child of this._children) {
			ELYSIA_DEV: DEV_CALL_LIFECYLE(
				child,
				child._callSiblingAdded,
				component
			)
			ELYSIA_PROD: child._callSiblingAdded(component);
		}
	}

	private _callComponentRemoved(component: Component): void {
		if (this._actorState !== ActorState.Active) return;

		ELYSIA_DEV: DEV_CALL_LIFECYLE(this, this.onComponentRemoved, component);
		ELYSIA_PROD: this.onComponentRemoved?.(component);

		for (let childComponent of this._components.values()) {
			ELYSIA_DEV: DEV_CALL_LIFECYLE(
				(<IComponentInternals>(<unknown>childComponent)),
				(<IComponentInternals>(<unknown>childComponent))._callSiblingRemoved,
				component
			)

			ELYSIA_PROD: (<IComponentInternals>(
				(<unknown>childComponent)
			))._callSiblingRemoved(component);
		}

		for (let child of this._children) {
			ELYSIA_DEV: DEV_CALL_LIFECYLE(child, child._callSiblingRemoved, component);
			ELYSIA_PROD: child._callSiblingRemoved(component);
		}
	}
}

export interface IActorInternals {
	_parent: Actor | null;
	_children: Set<Actor>;
	_components: Map<Constructor<Component>, Component>;
	_position: Vector3;
	_rotation: Quaternion;
	_scale: Vector3;
	_localMatrix: Matrix4;
	_worldMatrix: Matrix4;
	_transformDirty: boolean;
	_boundingBox: BoundingBox;
	_boundingSphere: BoundingSphere;

	_callStartup(): void;
	_callBeforeUpdate(delta: number, elapsed: number): void;
	_callUpdate(delta: number, elapsed: number): void;
	_callAfterUpdate(delta: number, elapsed: number): void;
	_callShutdown(): void;
	_callCanvasResize(width: number, height: number): void;
	_callSiblingAdded(sibling: Actor | Component): void;
	_callSiblingRemoved(sibling: Actor | Component): void;
	_callChildAdded(child: Actor): void;
	_callChildRemoved(child: Actor): void;
	_callComponentAdded(component: Component): void;
	_callComponentRemoved(component: Component): void;
}

let DEV_CALL_LIFECYLE = <T extends (...args: any) => any>(
	root: any,
	method: T,
	...args: Parameters<T>
) => {
	if(!method) return;
	try {
		return method.apply(root, args);
	} catch (e) {
		DEV_EXCEPTION(
			`in ${method.name} for ${root.constructor.name}`,
			{
				error: e,
				actor: root
			}
		)
	}
}