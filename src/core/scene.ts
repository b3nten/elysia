import { Actor, type IActorInternals } from "./actor.ts";
import type { AutoInitMap } from "../containers/autoinitmap.ts";
import type { ReadonlySet } from "../util/types.ts";
import { Application, type IApplicationInternals } from "./application.ts";
import type { IConstructable } from "./new.ts";
import { EXCEPTION } from "../util/exceptions.ts";

export enum SceneState {
	Inactive = 0,
	Active = 1,
	Ended = 2,
}

export class Scene implements IConstructable {
	readonly userData = new Map<unknown, unknown>();

	get children(): ReadonlySet<Actor> {
		return this._children;
	}

	addChild<T extends Actor>(child: T) {
		if(!(child instanceof Actor)) {
			EXCEPTION(
				"Cannot add non-actor to scene",
				{ child }
			)
		}

		if (child.parent) {
			child.parent.removeChild(child);
		}

		this._children.add(child);
		(<IActorInternals>(<unknown>child))._parent = null;

		if (this._state === SceneState.Active) {
			child._callStartup();
		}

		return child;
	}

	removeChild<T extends Actor>(child: T): T | null {
		let removed = this._children.delete(child);
		if (removed) {
			child._callShutdown();
			(<IActorInternals>(<unknown>child))._parent = null;
		}
		return removed ? child : null;
	}

	protected constructor() {
		(<IApplicationInternals>(<unknown>Application.instance))._scene = this;
	}

	protected onUpdate?(delta: number, elapsed: number): void;

	protected destructor?(): void;

	private _children = new Set<Actor>();

	private _state = SceneState.Inactive;

	private _callStart() {
		if (this._state !== SceneState.Inactive) return;

		this._state = SceneState.Active;
		for (let child of this._children) {
			child._callStartup();
		}
	}

	private _callEnd() {
		if (this._state !== SceneState.Active) return;
		this._state = SceneState.Ended;
		for (let child of this._children) {
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
