import type { IDestructible } from "../core/lifecycle.ts";

export interface Renderer extends IDestructible {
	uniforms: Record<string, any>;
	onCanvasResize(width: number, height: number): void;
	onSceneLoaded(scene: any): void;
	onRender(delta: number, elapsed: number): void;
}
