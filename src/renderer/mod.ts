export interface IRenderer {
	onCanvasResize(width: number, height: number): void;
	onSceneLoaded(scene: any): void;
	onRender(delta: number, elapsed: number): void;
}
