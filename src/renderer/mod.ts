import type {IDestructible} from "../core/interfaces.ts";

export interface IRenderer extends IDestructible {
	onCanvasResize(width: number, height: number): void;

	onSceneLoaded(scene: any): void;

	onRender(delta: number, elapsed: number): void;
}
