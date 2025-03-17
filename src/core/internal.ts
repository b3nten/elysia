import { createLogger, LogLevel } from "../log/logger.ts";
import { Actor } from "./actor.ts";
import { ObjectState } from "./lifecycle.ts";
import {type Matrix4, Quaternion, Vector3} from "../math/vectors.ts";

export let elysiaLogger = createLogger({
    name: "Elysia",
    level: LogLevel.Debug
})

export let SET_ELYSIA_LOGLVL = (level: LogLevel) => {
    elysiaLogger.level = level;
}

export const ELYSIA_INTERNAL = Symbol.for("elysia-internal");

export function ELYSIA_ASSERT_INTERNAL<T extends Object>(obj: T): asserts obj is { [ELYSIA_INTERNAL]: any } & T {
    if(!(ELYSIA_INTERNAL in obj)) {
        throw new Error("Object does not have ELYSIA_INTERNAL property");
    }
}

export class ElysiaIObjectInternalProperties {
    tags = new Set;
    state = ObjectState.Inactive;
    parent: Actor | null = null;
    ctor: any;
    constructor(
        ctor: any,
        parent: Actor = ParentContext.get()
    ) {
        this.parent = parent;
        this.ctor = ctor;
    }
}

export class ParentContext {
    static get() {
        let p = this._parent;
        return p;
    }

    static set(parent: Actor | null) {
        this._parent = parent;
    }

    static reset() {
        this._parent = null;
    }

    static _parent: Actor | null = null;
}

export let posFromMatrix = (matrix: Matrix4) => {
    let pos = new Vector3;
    let scale = new Vector3;
    let quat = new Quaternion;
    matrix.decompose(pos, quat, scale);
    return pos;
}