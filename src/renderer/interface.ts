import type { Destructible } from "../core/lifecycle.ts";

export interface Renderer extends Destructible {
	uniforms: Record<string, any>;
	onCanvasResize(width: number, height: number): void;
	onSceneLoaded(scene: any): void;
	onRender(delta: number, elapsed: number): void;
}
