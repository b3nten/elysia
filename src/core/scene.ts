import { Actor, type IActorInternals } from "./actor.ts";
import type { Constructor } from "../util/types.ts";
import { AutoInitMap } from "../containers/autoinitmap.ts";
import type { ReadonlySet } from "../util/types.ts";
import { Application } from "./application.ts";
import type { Component } from "./component.ts";
import { Destructible } from "../util/destructible.ts";

export enum SceneState {
    Inactive,
    Active,
    Ended
}

export class Scene {
    readonly userData = new Map<unknown, unknown>;

    get children(): ReadonlySet<Actor> { return this._children; }

    addChild<T extends Actor>(child: T) {
        if(child.active && child.parent) {
            child.parent.removeChild(child)
        } else {
            return child;
        }

        this._children.add(child);
        (<IActorInternals><unknown>child)._parent = null;

        if(this._state === SceneState.Active) {
            child._callStartup();
        }

        return child;
    }

    removeChild<T extends Actor>(child: T): T | null {
        let removed = this._children.delete(child);
        if(removed) {
            child._callShutdown();
            (<IActorInternals><unknown>child)._parent = null;
        }
        return removed ? child : null;
    }

    /**
     * Used to construct Actors and Components.
     * @param ctor
     * @param args
     */
    make = <T extends Actor | Component, Args extends any[]>(ctor: Constructor<T, Args>, ...args: Args) => {
        Destructible.modifyPrototype(ctor);
        return new ctor(...args);
    }

    static make = <T extends Actor | Component, Args extends any[]>(ctor: Constructor<T, Args>, ...args: Args) => {
        Destructible.modifyPrototype(ctor);
        return new ctor(...args);
    }

    protected constructor() {
        Application.instance._scene = this;
    }

    protected destructor() {}

    private _children = new Set<Actor>;

    private _state = SceneState.Inactive;

    private _callStart() {
        if(this._state !== SceneState.Inactive) return;

        this._state = SceneState.Active;

        for(let child of this._children) {
            child._callStartup();
        }
    }

    private _callUpdate(delta: number, elapsed: number) {
        if(this._state !== SceneState.Active) return;

        for(let child of this._children) {
            child._callBeforeUpdate(delta, elapsed);
        }

        for(let child of this._children) {
            child._callUpdate(delta, elapsed);
        }

        for(let child of this._children) {
            child._callAfterUpdate(delta, elapsed);
        }
    }

    private _callEnd() {
        if(this._state !== SceneState.Active) return;
        this._state = SceneState.Ended;
        for(let child of this._children) {
            child.destroy();
        }
        this.userData.clear();
    }
}

export interface ISceneInternals {
    _children: AutoInitMap<Actor, ReadonlySet<Actor>>;

    _callStart(): void;
    _callUpdate(delta: number, elapsed: number): void;
    _callEnd(): void;
}
