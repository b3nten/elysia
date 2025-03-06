import {
    setupIComponent,
    type IObject,
    ObjectState,
    shutdownComponent,
    startActor,
    destroyActor,
    shutdownActor,
    reparentActor,
    reparentComponent,
    startComponent
} from "./lifecycle.ts";
import {ELYSIA_INTERNAL, ElysiaInternalIObject} from "./internal.ts";
import type { Constructor, ReadonlySet, ReadonlyMap } from "../util/types.ts";
import { Application } from "./application.ts";
import { BoundingBox, BoundingSphere, Matrix4, Quaternion, Vector3 } from "../math/vectors.ts";
import {  type IComponent } from "./component.ts";
import { UNSAFE_isCtor } from "../util/asserts.ts";
import { AutoInitMap } from "../containers/autoinitmap.ts";

export class ActorInternalProperties extends ElysiaInternalIObject {
    children = new Set<Actor>;
    components = new Map<Constructor<IComponent> | IComponent, IComponent>;
    position = new Vector3;
    rotation = new Quaternion;
    scale = new Vector3;
    localMatrix = new Matrix4;
    worldMatrix = new Matrix4;
    transformIsDirty = false;
    boundingBox = new BoundingBox;
    boundingSphere = new BoundingSphere;
    childrenByTag = new AutoInitMap<any, Set<IObject>>(() => new Set);
}

export class Actor implements IObject {
    static isElysiaActor = true;

    static IsActor(a: any): a is Actor & IComponent {
        return a.IsActor;
    }

    get isElysiaActor() {
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
    >(component: T, ...args: Args): InstanceType<T> {
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
        reparentComponent(instance, this);
        startComponent(instance);

        for(let tag of instance[ELYSIA_INTERNAL].tags) {
            this[ELYSIA_INTERNAL].childrenByTag.get(tag).add(instance);
            this.scene[ELYSIA_INTERNAL].tags.get(tag).add(instance);
        }

        for(let component of this.components.values()) {
            (component as IObject).onSiblingAdded?.(instance);
        }

        for(let child of this.children.values()) {
            (child as IObject).onSiblingAdded?.(instance);
        }

        return instance as InstanceType<T>;
    }

    getComponent<T extends IComponent>(ctor: Constructor<T>): T | null {
        return this[ELYSIA_INTERNAL].components.get(ctor) as T ?? null;
    }

    removeComponent<T extends IComponent>(ctor: T): T | null {
        if(typeof ctor !== "function") {
            if(ctor.constructor !== EMPTY_CONSTRUCTOR) {
                ctor = ctor.constructor as unknown as any;
            }
        }

        let instance = this[ELYSIA_INTERNAL].components.get(ctor) as T;

        if(!instance) {
            return null;
        }

        shutdownComponent(instance);
        reparentComponent(instance, null);

        for(let tag of instance[ELYSIA_INTERNAL].tags) {
            this[ELYSIA_INTERNAL].childrenByTag.get(tag).delete(instance);
            this.scene[ELYSIA_INTERNAL].tags.get(tag).delete(instance);
        }

        for(let component of this.components.values()) {
            (component as IObject).onSiblingRemoved?.(instance);
        }
        for(let child of this.children.values()) {
            (child as IObject).onSiblingRemoved?.(instance);
        }

        return instance;
    }

    addChild<T extends Actor | Constructor<Actor>, Args extends any[] = any[]>(child: T, ...args: Args) {
        let instance: Actor = typeof child === "function" ? new child(...args) : child;
        reparentActor(instance, this);
        startActor(instance);

        for(let tag of instance[ELYSIA_INTERNAL].tags) {
            this[ELYSIA_INTERNAL].childrenByTag.get(tag).add(instance);
            this.scene[ELYSIA_INTERNAL].tags.get(tag).add(instance);
        }

        for(let component of this.components.values()) {
            (component as IObject).onSiblingAdded?.(instance);
        }
        for(let child of this.children.values()) {
            (child as IObject).onSiblingAdded?.(instance);
        }
        return instance;
    }

    removeChild<T extends Actor>(child: T): T {
        for(let component of this.components.values()) {
            (component as IObject).onSiblingRemoved?.(child);
        }
        for(let child of this.children.values()) {
            (child as IObject).onSiblingRemoved?.(child);
        }
        for(let tag of child[ELYSIA_INTERNAL].tags) {
            this[ELYSIA_INTERNAL].childrenByTag.get(tag).delete(child);
            this.scene[ELYSIA_INTERNAL].tags.get(tag).delete(child);
        }
        shutdownActor(child);
        reparentActor(child, null);
        return child;
    }

    add(p?: Actor) {
        if(p) {
            p.addChild(this);
        } else {
            this.scene.add(this);
        }
    }

    remove() {
        if(this.parent) {
            this.parent.removeChild(this);
        }
    }

    addTag(tag: any) {
        this[ELYSIA_INTERNAL].tags.add(tag);
        if(this.parent) {
            this.parent[ELYSIA_INTERNAL].childrenByTag.get(tag).add(this);
        }
    }

    removeTag(tag: any) {
        this[ELYSIA_INTERNAL].tags.delete(tag);
        if(this.parent) {
            this.parent[ELYSIA_INTERNAL].childrenByTag.get(tag).delete(this);
        }
    }

    getViaTag(tag: any): ReadonlySet<Actor> {
        return this[ELYSIA_INTERNAL].childrenByTag.get(tag) as unknown as ReadonlySet<Actor>;
    }

    constructor() {
        this[ELYSIA_INTERNAL].position.onChange = this.markTransformAsDirty
        this[ELYSIA_INTERNAL].rotation.onChange = this.markTransformAsDirty
        this[ELYSIA_INTERNAL].scale.onChange = this.markTransformAsDirty
    }

    destructor() {
        destroyActor(this, false);
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

    [ELYSIA_INTERNAL] = new ActorInternalProperties(this.constructor)
}

const EMPTY_CONSTRUCTOR = ({}).constructor;