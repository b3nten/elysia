export interface IObjectBase extends Object {}

export interface IDestructible {
	destructor?(): void;
}

export interface IObject extends IObjectBase, IDestructible {
	onStart?(): void;
	onBeforeUpdate?(): void;
	onUpdate?(): void;
	onAfterUpdate?(): void;
	onShutdown?(): void;
	onParent?(parent: IObject): void;
	onResize?(width: number, height: number): void;
	onPause?(): void;
	onResume?(): void;
}

export enum ObjectState {
	Inactive,
	Active,
	Destroyed,
}

export interface IScene extends IDestructible {
	onLoad?(): void | Promise<void>;
	onStart?(): void;
	onBeforeUpdate?(): void;
	onUpdate?(): void;
	onAfterUpdate?(): void;
	onResize?(width: number, height: number): void;
	onPause?(): void;
	onResume?(): void;
}

export interface ISystem extends IDestructible {
	onStart?(): void;
	onBeforeUpdate?(): void;
	onUpdate?(): void;
	onAfterUpdate?(): void;
	onShutdown?(): void;
	onResize?(width: number, height: number): void;
	onPause?(): void;
	onResume?(): void;
}