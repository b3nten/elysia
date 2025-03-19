import type { Constructor, ReadonlyMap, ReadonlySet } from "../util/types.ts";
import { Application } from "./application.ts";
import { BoundingBox, BoundingSphere, Matrix4, Quaternion, Vector3 } from "../math/vectors.ts";
import type { Component, IComponentInternals } from "./component.ts";
import { isConstructor } from "../util/asserts.ts";
import { type IBounded } from "./interfaces.ts";
import { throwDevException } from "../util/exceptions.ts";
import {Destructible} from "../util/destructible.ts";

export enum ActorState {
    Inactive,
    Active,
    Destroyed
}

export class Actor implements IBounded {

    static isActorType(a: any): a is Actor { return true }

    readonly isActor = true;

    get parent(): Actor | null { return this._parent }

    get active() { return this._actorState === ActorState.Active }

    get destroyed() { return this._actorState === ActorState.Destroyed }

    get valid() { return this._actorState !== ActorState.Destroyed }

    get components(): ReadonlyMap<Constructor<Component>, Component> {
        return this._components;
    }

    get children(): ReadonlySet<Actor> { return this._children }

    get position() { return this._position }

    get rotation() { return this._rotation }

    get scale() { return this._scale }

    get matrixWorld() {
        if(this._transformDirty) {
            this.updateMatrices();
        }
        return this._worldMatrix;
    }

    get matrix() {
        if(this._transformDirty) {
            this._localMatrix.compose(this.position, this.rotation, this.scale);
        }
        return this._localMatrix;
    }

    getBoundingBox() {
        return this._boundingBox;
    }

    getBoundingSphere() { return this._boundingSphere }

    markTransformAsDirty = () => {
        this._transformDirty = true;
        for(let child of this._children) {
            child.markTransformAsDirty();
        }
        for(let component of this._components.values()) {
            (<IComponentInternals><unknown>component)._parentTransformChanged = true;
        }
    }

    updateMatrices() {
        this._localMatrix.compose(this.position, this.rotation, this.scale);
        if(this.parent) {
            this._worldMatrix.multiplyMatrices(this.parent.matrixWorld, this.matrix);
        } else {
            this._worldMatrix.copy(this.matrix);
        }
        this._transformDirty = false;
    }

    addComponent<T extends Component>(component: T): T {
        if(this._components.has((<Constructor<T>>component.constructor))) {
            throw new Error(`Component ${component.constructor.name} already exists on Actor ${this.constructor.name}`);
        }

        if(component.active) {
            // parent must exist for it to be active
            (<IComponentInternals><unknown>component)._parent.removeComponent(component);
        }

        this._components.set((<Constructor<T>>component.constructor), component);
        (<IComponentInternals><unknown>component)._parent = this;
        (<IComponentInternals><unknown>component)._parentTransformChanged = true;

        if(this._actorState === ActorState.Active) {
            (<IComponentInternals><unknown>component)._callStartup();
            this._callComponentAdded(component);
        }

        return component;
    }

    tryAddComponent<T extends Component>(component: T): T | null {
        if(this._components.has((<Constructor<T>>component.constructor))) {
            return null;
        }
        return this.addComponent(component);
    }

    getComponent<T extends Component>(ctor: Constructor<T>): T | null {
        return this._components.get(ctor) as T ?? null;
    }

    removeComponent<T extends Component>(ctor: Constructor<T> | T): T | null {
        let component: T | undefined = isConstructor(ctor) ? <T>this._components.get(ctor) : ctor;

        if(component) {
            (<IComponentInternals><unknown>component)._callShutdown();
            this._components.delete(component.constructor as Constructor<Component>);
            (<IComponentInternals><unknown>component)._parent = null;
            this._callComponentRemoved(component);
        }

        return component;
    }

    addChild<T extends Actor>(child: T) {
        if(child.parent === this) {
            return child;
        }

        if(child.active) {
            (child.parent ?? this.scene).removeChild(child);
        }

        this._children.add(child);
        child._parent = this;

        if(this._actorState === ActorState.Active) {
            child._callStartup();
            this._callChildAdded(child);
        }

        return child;
    }

    removeChild<T extends Actor>(child: T): T | null {
        let removed = this._children.delete(child);
        if(removed) {
            child._callShutdown();
            (<IActorInternals><unknown>child)._parent = null;
            this._callChildRemoved(child);
        }
        return removed ? child : null;
    }

    dispatchComponentEvent(event: string | symbol, ...args: any[]) {
        for(let component of this.components.values()) {
            ELYSIA_DEV: try {
                component[event]?.(...args);
            } catch(e) {
                throwDevException(
                    `Component ${component.constructor.name} event handler threw an error: ${e}`,
                    e,
                );
            }
            ELYSIA_PROD: component[event]?.(...args);
        }
    }

    dispatchChildEvent(event: string | symbol, ...args: any[]) {
        for(let child of this.children.values()) {
            ELYSIA_DEV: try {
                child[event]?.(...args);
            } catch(e) {
                throwDevException(
                    `Child ${child.constructor.name} event handler threw an error: ${e}`,
                    e,
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
        if(this._actorState === ActorState.Destroyed) return;
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

    protected destructor() {

    }

    private _parent: Actor | null = null;
    private _actorState: ActorState = ActorState.Inactive;
    private _children: Set<Actor> = new Set();
    private _components: Map<Constructor<Component>, Component> = new Map();
    private _position = new Vector3;
    private _rotation = new Quaternion;
    private _scale = new Vector3;
    private _localMatrix = new Matrix4;
    private _worldMatrix = new Matrix4;
    private _transformDirty = true;
    private _boundingBox = new BoundingBox;
    private _boundingSphere = new BoundingSphere;

    _callStartup(): void {
        if(this._actorState !== ActorState.Inactive) return;
        this._actorState = ActorState.Active;

        ELYSIA_DEV: try {
            this.onStartup?.();
        } catch(e) {
            throwDevException(
                `Error in onStartup callback for ${this.constructor.name}`,
                e
            );
        }
        ELYSIA_PROD: this.onStartup?.();

        for(let component of this._components.values()) {
            ELYSIA_DEV: try {
                (<IComponentInternals><unknown>component)._callStartup();
            } catch(e) {
                throwDevException(
                    `Error in onStartup callback for ${component.constructor.name}`,
                    e
                );
            }
            ELYSIA_PROD: (<IComponentInternals><unknown>component)._callStartup();
        }

        for(let child of this._children) {
            ELYSIA_DEV: try {
                child._callStartup();
            } catch(e) {
                throwDevException(
                    `Error in onStartup callback for ${child.constructor.name}`,
                    e
                );
            }
            ELYSIA_PROD: child._callStartup();
        }
    }

    _callBeforeUpdate(delta: number, elapsed: number): void {
        if(this._actorState !== ActorState.Active) return;

        if(this._transformDirty) {
            this._transformDirty = false;
            ELYSIA_DEV: try {
                this.onTransformChanged?.();
            } catch(e) {
                throwDevException(
                    `Error in onTransformChanged callback for ${this.constructor.name}`,
                    e
                );
            }
            ELYSIA_PROD: this.onTransformChanged?.();
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

        for(let component of this._components.values()) {
            ELYSIA_DEV: try {
                (<IComponentInternals><unknown>component)._callBeforeUpdate(delta, elapsed);
            } catch(e) {
                throwDevException(
                    `Error in onBeforeUpdate callback for ${component.constructor.name}`,
                    e
                );
            }
            ELYSIA_PROD: (<IComponentInternals><unknown>component)._callBeforeUpdate(delta, elapsed);
        }

        for(let child of this._children) {
            ELYSIA_DEV: try {
                child._callBeforeUpdate(delta, elapsed);
            } catch(e) {
                throwDevException(
                    `Error in onBeforeUpdate callback for ${child.constructor.name}`,
                    e
                );
            }
            ELYSIA_PROD: child._callBeforeUpdate(delta, elapsed);
        }
    }

    _callUpdate(delta: number, elapsed: number): void {
        if(this._actorState !== ActorState.Active) return;

        ELYSIA_DEV: try {
            this.onUpdate?.(delta, elapsed);
        } catch(e) {
            throwDevException(
                `Error in onUpdate callback for ${this.constructor.name}`,
                e
            );
        }
        ELYSIA_PROD: this.onUpdate?.(delta, elapsed);

        for(let component of this._components.values()) {
            ELYSIA_DEV: try {
                (<IComponentInternals><unknown>component)._callUpdate(delta, elapsed);
            } catch(e) {
                throwDevException(
                    `Error in onUpdate callback for ${component.constructor.name}`,
                    e
                );
            }
            ELYSIA_PROD: (<IComponentInternals><unknown>component)._callUpdate(delta, elapsed);
        }

        for(let child of this._children) {
            ELYSIA_DEV: try {
                child._callUpdate(delta, elapsed);
            } catch(e) {
                throwDevException(
                    `Error in onUpdate callback for ${child.constructor.name}`,
                    e
                );
            }
            ELYSIA_PROD: child._callUpdate(delta, elapsed);
        }
    }

    _callAfterUpdate(delta: number, elapsed: number): void {
        if(this._actorState !== ActorState.Active) return;

        ELYSIA_DEV: try {
            this.onAfterUpdate?.(delta, elapsed);
        } catch(e) {
            throwDevException(
                `Error in onAfterUpdate callback for ${this.constructor.name}`,
                e
            );
        }
        ELYSIA_PROD: this.onAfterUpdate?.(delta, elapsed);

        for(let component of this._components.values()) {
            ELYSIA_DEV: try {
                (<IComponentInternals><unknown>component)._callAfterUpdate(delta, elapsed);
            } catch(e) {
                throwDevException(
                    `Error in onAfterUpdate callback for ${component.constructor.name}`,
                    e
                );
            }
            ELYSIA_PROD: (<IComponentInternals><unknown>component)._callAfterUpdate(delta, elapsed);
        }

        for(let child of this._children) {
            ELYSIA_DEV: try {
                child._callAfterUpdate(delta, elapsed);
            } catch(e) {
                throwDevException(
                    `Error in onAfterUpdate callback for ${child.constructor.name}`,
                    e
                );
            }
            ELYSIA_PROD: child._callAfterUpdate(delta, elapsed);
        }
    }

    _callShutdown(): void {
        if(this._actorState !== ActorState.Active) return;
        this._actorState = ActorState.Destroyed;

        ELYSIA_DEV: try {
            this.onShutdown?.();
        } catch(e) {
            throwDevException(
                `Error in onShutdown callback for ${this.constructor.name}`,
                e
            );
        }
        ELYSIA_PROD: this.onShutdown?.();

        for(let component of this._components.values()) {
            ELYSIA_DEV: try {
                (<IComponentInternals><unknown>component)._callShutdown();
            } catch(e) {
                throwDevException(
                    `Error in onShutdown callback for ${component.constructor.name}`,
                    e
                );
            }
            ELYSIA_PROD: (<IComponentInternals><unknown>component)._callShutdown();
        }

        for(let child of this._children) {
            ELYSIA_DEV: try {
                child._callShutdown();
            } catch(e) {
                throwDevException(
                    `Error in onShutdown callback for ${child.constructor.name}`,
                    e
                );
            }
            ELYSIA_PROD: child._callShutdown();
        }
    }

    _callCanvasResize(width: number, height: number): void {
        if(this._actorState !== ActorState.Active) return;

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

    _callSiblingAdded(sibling: Actor | Component): void {
        if(this._actorState !== ActorState.Active) return;

        ELYSIA_DEV: try {
            this.onSiblingAdded?.(sibling);
        } catch(e) {
            throwDevException(
                `Error in onSiblingAdded callback for ${this.constructor.name}`,
                e
            );
        }
        ELYSIA_PROD: this.onSiblingAdded?.(sibling);
    }

    _callSiblingRemoved(sibling: Actor | Component): void {
        if(this._actorState !== ActorState.Active) return;

        ELYSIA_DEV: try {
            this.onSiblingRemoved?.(sibling);
        } catch(e) {
            throwDevException(
                `Error in onSiblingRemoved callback for ${this.constructor.name}`,
                e
            );
        }
        ELYSIA_PROD: this.onSiblingRemoved?.(sibling);
    }

    _callChildAdded(child: Actor): void {
        if(this._actorState !== ActorState.Active) return;

        ELYSIA_DEV: try {
            this.onChildAdded?.(child);
        } catch(e) {
            throwDevException(
                `Error in onChildAdded callback for ${this.constructor.name}`,
                e
            );
        }

        for(let component of this._components.values()) {
            ELYSIA_DEV: try {
                (<IComponentInternals><unknown>component)._callSiblingAdded(child);
            } catch (e) {
                throwDevException(
                    `Error in onChildAdded callback for ${component.constructor.name}`,
                    e
                );
            }
            ELYSIA_PROD: (<IComponentInternals><unknown>component)._callSiblingAdded(child);
        }

        for(let sibling of this._children) {
            ELYSIA_DEV: try {
                sibling._callSiblingAdded(child);
            } catch(e) {
                throwDevException(
                    `Error in onChildAdded callback for ${sibling.constructor.name}`,
                    e
                );
            }
            ELYSIA_PROD: sibling._callSiblingAdded(child);
        }
    }

    _callChildRemoved(child: Actor): void {
        if(this._actorState !== ActorState.Active) return;

        ELYSIA_DEV: try {
            this.onChildRemoved?.(child);
        } catch(e) {
            throwDevException(
                `Error in onChildRemoved callback for ${this.constructor.name}`,
                e
            );
        }

        for(let component of this._components.values()) {
            ELYSIA_DEV: try {
                (<IComponentInternals><unknown>component)._callSiblingRemoved(child);
            } catch(e) {
                throwDevException(
                    `Error in onChildRemoved callback for ${component.constructor.name}`,
                    e
                );
            }
            ELYSIA_PROD: (<IComponentInternals><unknown>component)._callSiblingRemoved(child);
        }

        for(let sibling of this._children) {
            ELYSIA_DEV: try {
                sibling._callSiblingRemoved(child);
            } catch(e) {
                throwDevException(
                    `Error in onChildRemoved callback for ${sibling.constructor.name}`,
                    e
                );
            }
            ELYSIA_PROD: sibling._callSiblingRemoved(child);
        }
    }

    _callComponentAdded(component: Component): void {
        if(this._actorState !== ActorState.Active) return;

        ELYSIA_DEV: try {
            this.onComponentAdded?.(component);
        } catch(e) {
            throwDevException(
                `Error in onComponentAdded callback for ${this.constructor.name}`,
                e
            );
        }
        ELYSIA_PROD: this.onComponentAdded?.(component);

        for(let childComponent of this._components.values()) {
            ELYSIA_DEV: try {
                (<IComponentInternals><unknown>childComponent)._callSiblingAdded(component);
            } catch(e) {
                throwDevException(
                    `Error in onComponentAdded callback for ${childComponent.constructor.name}`,
                    e
                );
            }
            ELYSIA_PROD: (<IComponentInternals><unknown>childComponent)._callSiblingAdded(component);
        }

        for(let child of this._children) {
            ELYSIA_DEV: try {
                child._callSiblingAdded(component);
            } catch(e) {
                throwDevException(
                    `Error in onComponentAdded callback for ${child.constructor.name}`,
                    e
                );
            }
            ELYSIA_PROD: child._callSiblingAdded(component);
        }
    }

    _callComponentRemoved(component: Component): void {
        if(this._actorState !== ActorState.Active) return;

        ELYSIA_DEV: try {
            this.onComponentRemoved?.(component);
        } catch(e) {
            throwDevException(
                `Error in onComponentRemoved callback for ${this.constructor.name}`,
                e
            );
        }

        for(let childComponent of this._components.values()) {
            ELYSIA_DEV: try {
                (<IComponentInternals><unknown>childComponent)._callSiblingRemoved(component);
            } catch(e) {
                throwDevException(
                    `Error in onComponentRemoved callback for ${childComponent.constructor.name}`,
                    e
                );
            }
            ELYSIA_PROD: (<IComponentInternals><unknown>childComponent)._callSiblingRemoved(component);
        }

        for(let child of this._children) {
            ELYSIA_DEV: try {
                child._callSiblingRemoved(component);
            } catch(e) {
                throwDevException(
                    `Error in onComponentRemoved callback for ${child.constructor.name}`,
                    e
                );
            }
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