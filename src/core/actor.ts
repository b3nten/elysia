import { type IObject, ObjectState } from "./lifecycle.ts";
import { ELYSIA_INTERNAL } from "./internal.ts";
import type { Constructor, ReadonlySet } from "../util/types.ts";
import { Application } from "./application.ts";
import {BoundingBox, BoundingSphere, Matrix4, Quaternion, Vector3} from "../math/vectors.ts";
import type { IComponent } from "./component.ts";
import { UNSAFE_isCtor } from "../util/asserts.ts";

export class Actor implements IObject {
    get active() {
        return this[ELYSIA_INTERNAL].state === ObjectState.Active;
    }

    get destroyed() {
        return this[ELYSIA_INTERNAL].state === ObjectState.Destroyed;
    }

    get valid() {
        return this[ELYSIA_INTERNAL].state !== ObjectState.Destroyed;
    }

    get parent() {
        return this[ELYSIA_INTERNAL].parent;
    }

    get components(): ReadonlySet<IComponent> {
        return this[ELYSIA_INTERNAL].components;
    }

    get children(): ReadonlySet<Actor> {
        return this[ELYSIA_INTERNAL].children;
    }

    get position() {
        return this[ELYSIA_INTERNAL].position;
    }

    get rotation() {
        return this[ELYSIA_INTERNAL].rotation;
    }

    get scale() {
        return this[ELYSIA_INTERNAL].scale;
    }

    get matrixWorld() {
        if(this[ELYSIA_INTERNAL].transformIsDirty) {
            this.updateMatrices();
        }
        return this[ELYSIA_INTERNAL].worldMatrix;
    }

    get matrix() {
        if(this[ELYSIA_INTERNAL].transformIsDirty) {
            this[ELYSIA_INTERNAL].localMatrix.compose(this.position, this.rotation, this.scale);
        }
        return this[ELYSIA_INTERNAL].localMatrix;
    }

    get boundingBox() {
        return this[ELYSIA_INTERNAL].boundingBox;
    }

    get boundingSphere() {
        return this[ELYSIA_INTERNAL].boundingSphere;
    }

    markTransformAsDirty = () => {
        this[ELYSIA_INTERNAL].transformIsDirty = true;
    }

    updateMatrices() {
        this[ELYSIA_INTERNAL].localMatrix.compose(this.position, this.rotation, this.scale);
        if(this.parent) {
            this.parent.updateMatrices();
            this[ELYSIA_INTERNAL].worldMatrix.multiplyMatrices(this.parent.matrixWorld, this.matrix);
        } else {
            this[ELYSIA_INTERNAL].worldMatrix.copy(this.matrix);
        }
        this[ELYSIA_INTERNAL].transformIsDirty = false;
    }

    calculateBoundingBox() {
        return this[ELYSIA_INTERNAL].boundingBox;
    }

    calculateBoundingSphere() {
        return this[ELYSIA_INTERNAL].boundingSphere;
    }

    addComponent<
        T extends IComponent | Constructor<IComponent>, Args extends any[] = any[]
    >(component: T, ...args: Args) {
        let ctor: Constructor<IComponent> = UNSAFE_isCtor(component)
                ? component
                : component.constructor as Constructor<IComponent>;

        ELYSIA_DEV: {
            if (this[ELYSIA_INTERNAL].components.has(ctor)) {
                throw new Error(`Component of type ${ctor.name} already exists on actor.`);
            }
        }

        ELYSIA_PROD: {
            if (this[ELYSIA_INTERNAL].components.has(ctor)) {
                return;
            }
        }

        let instance: IComponent = typeof component === "function" ? new component(...args) : component;
        this[ELYSIA_INTERNAL].components.set(ctor, instance);

        // todo: lifecycle hooks

        return instance;
    }

    getComponent<T extends IComponent>(ctor: Constructor<T>): T | null {
        return this[ELYSIA_INTERNAL].components.get(ctor) as T ?? null;
    }

    removeComponent<T extends IComponent>(component: T): T {
        // todo: lifecycle hooks
        this[ELYSIA_INTERNAL].components.delete(component.constructor as Constructor<IComponent>);
        return component;
    }

    addChild<T extends Actor | Constructor<Actor>, Args extends any[] = any[]>(child: T, ...args: Args) {
        let instance: Actor = typeof child === "function" ? new child(...args) : child;

        this[ELYSIA_INTERNAL].children.add(instance);

        instance[ELYSIA_INTERNAL].parent = this;

        // todo: lifecycle hooks

        return instance;
    }

    removeChild<T extends Actor>(child: T): T {
        // todo: lifecycle hooks
        this[ELYSIA_INTERNAL].children.delete(child);
        child[ELYSIA_INTERNAL].parent = null;
        return child;
    }

    constructor() {
        this[ELYSIA_INTERNAL].position.onChange = this.markTransformAsDirty
        this[ELYSIA_INTERNAL].rotation.onChange = this.markTransformAsDirty
        this[ELYSIA_INTERNAL].scale.onChange = this.markTransformAsDirty
    }

    destructor() {
        // todo: lifecycle hooks
        this[ELYSIA_INTERNAL].state = ObjectState.Destroyed;
        this[ELYSIA_INTERNAL].parent = null;
        this[ELYSIA_INTERNAL].children.clear();
        this[ELYSIA_INTERNAL].components.clear();
        this[ELYSIA_INTERNAL].localMatrix.identity();
        this[ELYSIA_INTERNAL].worldMatrix.identity();
        this[ELYSIA_INTERNAL].boundingBox.reset();
        this[ELYSIA_INTERNAL].boundingSphere.reset();
        this[ELYSIA_INTERNAL].position.onChange = null;
        this[ELYSIA_INTERNAL].rotation.onChange = null;
        this[ELYSIA_INTERNAL].scale.onChange = null;
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
        state: ObjectState.Inactive,
        parent: null as Actor | null,
        children: new Set<Actor>,
        components: new Map<Constructor<IComponent>, IComponent>,
        position: new Vector3,
        rotation: new Quaternion,
        scale: new Vector3,
        localMatrix: new Matrix4,
        worldMatrix: new Matrix4,
        transformIsDirty: true,
        boundingBox: new BoundingBox,
        boundingSphere: new BoundingSphere
    }
}
