import { type Actor  } from "./actor.ts";
import { Application } from "./application.ts";
import { throwDevException } from "../util/exceptions.ts";
import {Destructible} from "../util/destructible.ts";

enum ComponentState {
	Inactive,
	Active,
	Destroyed
}

export class Component {
	static isComponentType(a: any): a is Component { return true; }

	readonly isComponent = true;

	/**
	 * Gets the parent actor.
	 */
	get parent(): Actor | null { return this._parent; }

	/**
	 * Gets whether the component is active.
	 */
	get active() { return this._componentState === ComponentState.Active; }

	/**
	 * Gets whether the component is destroyed.
	 */
	get destroyed() { return this._componentState === ComponentState.Destroyed; }

	/**
	 * Gets whether the component is either active or inactive.
	 */
	get valid() {
		return this._componentState !== ComponentState.Destroyed;
	}

	destroy() {
		if(this.destroyed) return;
		Destructible.destroy(this);
	}

	/**
	 * Gets the application instance.
	 * @protected
	 */
	protected get app() { return Application.instance; }

	/**
	 * Gets the current scene.
	 * @protected
	 */
	protected get scene() { return Application.scene; }

	/**
	 * Gets the current renderer.
	 * @protected
	 */
	protected get renderer() { return Application.renderer; }

	protected constructor() {}

	/**
	 * Called when the Component is started up.
	 * @protected
	 */
	protected onStartup?(): void;

	/**
	 * Called before the Component is updated.
	 * @param delta
	 * @param elapsed
	 * @protected
	 */
	protected onBeforeUpdate?(delta: number, elapsed: number): void;

	/**
	 * Called when the Component is updated.
	 * @param delta
	 * @param elapsed
	 * @protected
	 */
	protected onUpdate?(delta: number, elapsed: number): void;

	/**
	 * Called after the Component is updated.
	 * @param delta
	 * @param elapsed
	 * @protected
	 */
	protected onAfterUpdate?(delta: number, elapsed: number): void;

	/**
	 * Called when the Component is shut down.
	 * @protected
	 */
	protected onShutdown?(): void;

	/**
	 * Called when the canvas is resized.
	 * This is only called if the Component is active.
	 * @param width
	 * @param height
	 * @protected
	 */
	protected onCanvasResize?(width: number, height: number): void;

	/**
	 * Called when a sibling Component is added to the parent Actor.
	 * This is only called if the Component is active.
	 * @param sibling
	 * @protected
	 */
	protected onSiblingAdded?(sibling: Actor | Component): void;

	/**
	 * Called when a sibling Component is removed from the parent Actor.
	 * This is only called if the Component is active.
	 * @param sibling
	 * @protected
	 */
	protected onSiblingRemoved?(sibling: Actor | Component): void;

	/**
	 * Called when the parent Actor's world space transform is changed.
	 * This is only called if the Component is active.
	 * @protected
	 */
	protected onParentTransformChanged?(): void;

	protected destructor() {
		this._callShutdown();
		this._componentState = ComponentState.Destroyed;
		this._parent = null;
	}

	/** @internal */
	private _componentState = ComponentState.Inactive;
	/** @internal */
	private _parent: Actor | null = null;
	/** @internal */
	private _parentTransformChanged = false;

	/** @internal */
	private _callStartup(): void {
		if(this.destroyed || this._componentState !== ComponentState.Inactive) return;
		this._componentState = ComponentState.Active;
		ELYSIA_DEV: try {
			this.onStartup?.();
		} catch(e) {
			throwDevException(
				`Error in onStartup callback for ${this.constructor.name}`,
				e
			);
		}
		ELYSIA_PROD: this.onStartup?.();
	}

	/** @internal */
	private _callBeforeUpdate(delta: number, elapsed: number): void {
		if(this.destroyed || !this.active) return;
		if(this._parentTransformChanged) {
			this._parentTransformChanged = false;
			ELYSIA_DEV: try {
				this.onParentTransformChanged?.();
			} catch(e) {
				throwDevException(
					`Error in onParentTransformChanged callback for ${this.constructor.name}`,
					e
				)
			}
			ELYSIA_PROD: this.onParentTransformChanged?.();
		}
		ELYSIA_DEV: try {
			this.onBeforeUpdate?.(delta, elapsed);
		} catch(e) {
			throwDevException(
				`Error in onBeforeUpdate callback for ${this.constructor.name}`,
				e
			);
		}
		ELYSIA_PROD: this.onBeforeUpdate?.(delta, elapsed);
	}

	/** @internal */
	private _callUpdate(delta: number, elapsed: number): void {
		if(this.destroyed || !this.active) return;
		ELYSIA_DEV: try {
			this.onUpdate?.(delta, elapsed);
		} catch(e) {
			throwDevException(
				`Error in onUpdate callback for ${this.constructor.name}`,
				e
			);
		}
		ELYSIA_PROD: this.onUpdate?.(delta, elapsed);
	}

	/** @internal */
	private _callAfterUpdate(delta: number, elapsed: number): void {
		if(this.destroyed) return;
		ELYSIA_DEV: try {
			this.onAfterUpdate?.(delta, elapsed);
		} catch(e) {
			throwDevException(
				`Error in onAfterUpdate callback for ${this.constructor.name}`,
				e
			);
		}
		ELYSIA_PROD: this.onAfterUpdate?.(delta, elapsed);
	}

	/** @internal */
	private _callShutdown(): void {
		if(this.destroyed) return;
		ELYSIA_DEV: try {
			this.onShutdown?.();
		} catch(e) {
			throwDevException(
				`Error in onShutdown callback for ${this.constructor.name}`,
				e
			);
		}
		ELYSIA_PROD: this.onShutdown?.();
	}

	/** @internal */
	private _callCanvasResize(width: number, height: number): void {
		if(this.destroyed || !this.active) return;
		ELYSIA_DEV: try {
			this.onCanvasResize?.(width, height);
		} catch(e) {
			throwDevException(
				`Error in onCanvasResize callback for ${this.constructor.name}`,
				e
			);
		}
		ELYSIA_PROD: this.onCanvasResize?.(width, height);
	}

	/** @internal */
	private _callSiblingAdded(sibling: Actor | Component): void {
		if(this.destroyed || !this.active) return;
		ELYSIA_DEV: try {
			this.onSiblingAdded?.(sibling);
		} catch(e) {
			throwDevException(
				`Error in onSiblingAdded callback for ${this.constructor.name}`,
				e
			)
		}
		ELYSIA_PROD: this.onSiblingAdded?.(sibling);
	}

	/** @internal */
	private _callSiblingRemoved(sibling: Actor | Component): void {
		if(this.destroyed || !this.active) return;
		ELYSIA_DEV: try {
			this.onSiblingRemoved?.(sibling);
		} catch(e) {
			throwDevException(
				`Error in onSiblingRemoved callback for ${this.constructor.name}`,
				e
			)
		}
		ELYSIA_PROD: this.onSiblingRemoved?.(sibling);
	}

	/** @internal */
	private _callParentTransformChanged(): void {
		if(this._componentState !== ComponentState.Active) return;
		ELYSIA_DEV: try {
			this.onParentTransformChanged?.();
		} catch(e) {
			throwDevException(
				`Error in onParentTransformChanged callback for ${this.constructor.name}`,
				e
			)
		}
		ELYSIA_PROD: this.onParentTransformChanged?.();
	}
}

export interface IComponentInternals {
	_state: ComponentState;
	_parent: Actor | null;
	_parentTransformChanged: boolean;

	_callStartup(): void;
	_callBeforeUpdate(delta: number, elapsed: number): void;
	_callUpdate(delta: number, elapsed: number): void;
	_callAfterUpdate(delta: number, elapsed: number): void;
	_callShutdown(): void;
	_callCanvasResize(width: number, height: number): void;
	_callSiblingAdded(sibling: Actor | Component): void;
	_callSiblingRemoved(sibling: Actor | Component): void;
	_callParentTransformChanged(): void;
}