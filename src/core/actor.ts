import {
    setupIComponent,
    type IObject,
    ObjectState,
    shutdownComponent,
    startActor,
    destroyActor,
    shutdownActor
} from "./lifecycle.ts";
import { ELYSIA_INTERNAL } from "./internal.ts";
import type { Constructor, ReadonlySet, ReadonlyMap } from "../util/types.ts";
import { Application } from "./application.ts";
import { BoundingBox, BoundingSphere, Matrix4, Quaternion, Vector3 } from "../math/vectors.ts";
import {  type IComponent } from "./component.ts";
import { UNSAFE_isCtor } from "../util/asserts.ts";

export class Actor implements IObject {
    static IsActor(a: any): a is Actor & IComponent {
        return a.isActor;
    }

    get isActor() {
        return true;
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

    get parent() {
        return this[ELYSIA_INTERNAL].parent;
    }

    get components(): ReadonlyMap<Constructor<IComponent> | IComponent, IComponent> {
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
                : component.constructor === EMPTY_CONSTRUCTOR
                    ? component as Constructor<IComponent>
                    : component.constructor as Constructor<IComponent>


        ELYSIA_DEV: {
            if (this[ELYSIA_INTERNAL].components.has(ctor)) {
                throw new Error(`Component of type ${String(ctor)} already exists on actor.`);
            }
        }

        ELYSIA_PROD: {
            if (this[ELYSIA_INTERNAL].components.has(ctor)) {
                return;
            }
        }

        let instance: IComponent = typeof component === "function" ? new component(...args) : component;

        setupIComponent(instance, this);

        this[ELYSIA_INTERNAL].components.set(ctor, instance);
        this.scene[ELYSIA_INTERNAL].componentsByType.get(ctor).add(instance);

        return instance;
    }

    getComponent<T extends IComponent>(ctor: Constructor<T>): T | null {
        return this[ELYSIA_INTERNAL].components.get(ctor) as T ?? null;
    }

    removeComponent<T extends IComponent>(component: T): T {
        shutdownComponent(component);
        component[ELYSIA_INTERNAL].parent = null;
        let ctor = component[ELYSIA_INTERNAL].noCtor ? component : component.constructor as Constructor<IComponent>;
        this[ELYSIA_INTERNAL].components.delete(ctor);
        this.scene[ELYSIA_INTERNAL].componentsByType.get(ctor).delete(component);
        return component;
    }

    addChild<T extends Actor | Constructor<Actor>, Args extends any[] = any[]>(child: T, ...args: Args) {
        let instance: Actor = typeof child === "function" ? new child(...args) : child;
        this[ELYSIA_INTERNAL].children.add(instance);
        instance[ELYSIA_INTERNAL].parent = this;
        startActor(instance)
        this.scene[ELYSIA_INTERNAL].actorsByType.get(instance.constructor as Constructor<Actor>).add(instance);
        return instance;
    }

    removeChild<T extends Actor>(child: T): T {
        shutdownActor(child);
        this[ELYSIA_INTERNAL].children.delete(child);
        this.scene[ELYSIA_INTERNAL].actorsByType.get(child.constructor as Constructor<Actor>).delete(child);
        return child;
    }

    remove() {
        if(this.parent) {
            this.parent.removeChild(this);
        }
    }

    constructor() {
        this[ELYSIA_INTERNAL].position.onChange = this.markTransformAsDirty
        this[ELYSIA_INTERNAL].rotation.onChange = this.markTransformAsDirty
        this[ELYSIA_INTERNAL].scale.onChange = this.markTransformAsDirty
    }

    destructor() {
        destroyActor(this);
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
        components: new Map<Constructor<IComponent> | IComponent, IComponent>,
        position: new Vector3,
        rotation: new Quaternion,
        scale: new Vector3,
        localMatrix: new Matrix4,
        worldMatrix: new Matrix4,
        transformIsDirty: false,
        boundingBox: new BoundingBox,
        boundingSphere: new BoundingSphere
    }
}

const EMPTY_CONSTRUCTOR = ({}).constructor;