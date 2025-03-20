import type { IRenderer } from "../renderer/mod.ts";
import { createLogger } from "../log/mod.ts";


export class DevRenderer implements IRenderer {
	onSceneLoaded(scene: any) {
		this._logger.success("onSceneLoaded", scene);
	}

	onRender(delta: number, elapsed: number) {
		this._logger.info("onRender", delta, elapsed);
	}

	onCanvasResize(width: number, height: number) {
		this._logger.info("onCanvasResize", width, height);
	}

	_logger = createLogger({
		name: "DevRenderer",
	})
}
