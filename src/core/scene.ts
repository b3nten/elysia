
import { ELYSIA_INTERNAL } from "./internal.ts";
import { Actor } from "./actor.ts";
import type {Constructor} from "../util/types.ts";
import { AutoInitMap } from "../containers/autoinitmap.ts";
import type { ReadonlySet } from "../util/types.ts";
import type {IComponent} from "./component.ts";
import {type IDestructible, ObjectState} from "./lifecycle.ts";

export class Scene implements IDestructible {
    [ELYSIA_INTERNAL] = {
        root: new Actor,
        actorsByType: new AutoInitMap<Constructor<Actor>, Set<Actor>>(() => new Set),
        componentsByType: new AutoInitMap<unknown, Set<IComponent>>(() => new Set),
        callLoad: async () => {
            if(this.onLoad) {
                await this.onLoad();
            }
        },
        state: ObjectState.Inactive,
    }

    get root () {
        return this[ELYSIA_INTERNAL].root;
    }

    add: Actor["addChild"] = this[ELYSIA_INTERNAL].root.addChild.bind(this[ELYSIA_INTERNAL].root);

    remove: Actor["removeChild"] = this[ELYSIA_INTERNAL].root.removeChild.bind(this[ELYSIA_INTERNAL].root);

    getActors<T extends Actor>(ctor: Constructor<T>): ReadonlySet<T> {
        return this[ELYSIA_INTERNAL].actorsByType.get(ctor) as unknown as ReadonlySet<T>;
    }

    getComponents<T extends IComponent>(ctorOrInstance: unknown): ReadonlySet<T> {
        return this[ELYSIA_INTERNAL].componentsByType.get(ctorOrInstance) as unknown as ReadonlySet<T>;
    }

    protected onLoad?(): void | Promise<void>;

    destructor() {
        if(this[ELYSIA_INTERNAL].state === ObjectState.Destroyed) {
            return;
        }
        this[ELYSIA_INTERNAL].root.destructor();
        this[ELYSIA_INTERNAL].root = new Actor;
        this[ELYSIA_INTERNAL].actorsByType.clear();
        this[ELYSIA_INTERNAL].componentsByType.clear();
    }
}
