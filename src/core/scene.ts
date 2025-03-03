import type { IScene } from "./lifecycle.ts";
import { ELYSIA_INTERNAL } from "./internal.ts";
import { Actor } from "./actor.ts";

export class Scene implements IScene {

    constructor() {
        this[ELYSIA_INTERNAL].root[ELYSIA_INTERNAL].parent = this[ELYSIA_INTERNAL].root;
    }

    destructor() {

    }

    [ELYSIA_INTERNAL] = {
        root: new Actor,
    }
}