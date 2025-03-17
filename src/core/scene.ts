
import {ELYSIA_INTERNAL, ParentContext} from "./internal.ts";
import { Actor } from "./actor.ts";
import type {Constructor} from "../util/types.ts";
import { AutoInitMap } from "../containers/autoinitmap.ts";
import type { ReadonlySet } from "../util/types.ts";
import {type IDestructible, type IObject, ObjectState, reparentActor, shutdownActor, startActor} from "./lifecycle.ts";
import {Application} from "./application.ts";
import type { Component } from "./component.ts";

export class Scene implements IDestructible {
    [ELYSIA_INTERNAL] = {
        actors: new Set<Actor>,
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

    addActor<T extends Constructor<Actor> | Actor, Args extends any[] = any[]>(actor: T, ...args: Args) {
        // todo: implement
    }

    removeActor(actor: Actor) {
        // todo: implement
    }

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
        Application.instance[ELYSIA_INTERNAL].scene = this;
    }

    destructor() {
        if(this[ELYSIA_INTERNAL].state === ObjectState.Destroyed) {
            return;
        }
        this[ELYSIA_INTERNAL].actorsByType.clear();
        this[ELYSIA_INTERNAL].componentsByType.clear();
        this[ELYSIA_INTERNAL].tags.clear();
        this.userData.clear();
        this[ELYSIA_INTERNAL].state = ObjectState.Destroyed;
    }

    protected onLoad?(): void | Promise<void>;
}
