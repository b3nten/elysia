import { SET_ELYSIA_DEV } from "../src/Shared/Asserts.ts";

SET_ELYSIA_DEV(true);

document.body.style.width = "100%";
document.body.style.height = "100vh";
document.body.style.margin = "0";

// const splash = document.createElement("elysia-splash") as ElysiaSplash;

// document.body.append(splash);

// import("./PlaygroundGame/Game.ts")
// 	.then(({ scene, app }) => app.loadScene(scene))
// 	.then(() => setTimeout(() => splash.goodbye(), 2000));

import("./game.ts")
// import("./uitest.ts")