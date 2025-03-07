
import { ELYSIA_INTERNAL } from "./internal.ts";
import { Actor } from "./actor.ts";
import type {Constructor} from "../util/types.ts";
import { AutoInitMap } from "../containers/autoinitmap.ts";
import type { ReadonlySet } from "../util/types.ts";
import { type IDestructible, type IObject, ObjectState } from "./lifecycle.ts";
import {Application} from "./application.ts";
import type { Component } from "./component.ts";

export class Scene implements IDestructible {
    [ELYSIA_INTERNAL] = {
        root: null as unknown as Actor,
        actorsByType: new AutoInitMap<Constructor<Actor>, Set<Actor>>(() => new Set),
        componentsByType: new AutoInitMap<unknown, Set<Component>>(() => new Set),
        callLoad: async () => {
            if(this.onLoad) {
                await this.onLoad();
            }
        },
        state: ObjectState.Inactive,
        tags: new AutoInitMap<any, Set<IObject>>(() => new Set)
    }

    readonly userData = new Map<unknown, unknown>;

    // readonly batchedMeshPool = new BatchedMeshPool;

    get root () {
        return this[ELYSIA_INTERNAL].root;
    }

    add: Actor["addChild"];

    remove: Actor["removeChild"];

    getActors<T extends Actor>(ctor: Constructor<T>): ReadonlySet<T> {
        return this[ELYSIA_INTERNAL].actorsByType.get(ctor) as unknown as ReadonlySet<T>;
    }

    getComponents<T extends Component>(ctorOrInstance: unknown): ReadonlySet<T> {
        return this[ELYSIA_INTERNAL].componentsByType.get(ctorOrInstance) as unknown as ReadonlySet<T>;
    }

    getByTag(tag: any): ReadonlySet<IObject> {
        return this[ELYSIA_INTERNAL].tags.get(tag) as unknown as ReadonlySet<IObject>;
    }

    constructor() {
        /* The order here matters. Everything needs scene initialized first.
           Scene.root needs to be created before it's methods are accessed.
           Ideally we could create this in a better way,
           but we want to support initialization via constructors. */
        Application.instance[ELYSIA_INTERNAL].scene = this;
        this[ELYSIA_INTERNAL].root = new Actor;
        this.add = this[ELYSIA_INTERNAL].root.addChild.bind(this[ELYSIA_INTERNAL].root);
        this.remove = this[ELYSIA_INTERNAL].root.removeChild.bind(this[ELYSIA_INTERNAL].root)
    }

    destructor() {
        if(this[ELYSIA_INTERNAL].state === ObjectState.Destroyed) {
            return;
        }
        this[ELYSIA_INTERNAL].root.destructor();
        this[ELYSIA_INTERNAL].root = new Actor;
        this[ELYSIA_INTERNAL].actorsByType.clear();
        this[ELYSIA_INTERNAL].componentsByType.clear();
    }

    protected onLoad?(): void | Promise<void>;
}
