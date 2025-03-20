import { createEvent } from "../events/event.ts";

export const EBeforeUpdate = createEvent<{ delta; elapsed }>(
	"elysiatech:Application:beforeUpdate",
);
export const EUpdate = createEvent<{ delta; elapsed }>(
	"elysiatech:Application:update",
);
export const EAfterUpdate = createEvent<{ delta; elapsed }>(
	"elysiatech:Application:afterUpdate",
);
export const EBeforeRender = createEvent<{ delta; elapsed }>(
	"elysiatech:Application:beforeRender",
);
export const EAfterRender = createEvent<{ delta; elapsed }>(
	"elysiatech:Application:afterRender",
);
export const ECanvasResize = createEvent<{ x: number; y: number }>(
	"elysiatech:Application:canvasResize",
);
export const ESceneLoaded = createEvent<void>(
	"elysiatech:Application:sceneLoaded",
);
export const ESceneStarted = createEvent<void>(
	"elysiatech:Application:sceneStarted",
);
export const ESceneLoadError = createEvent<void>(
	"elysiatech:Application:sceneLoadError",
);
