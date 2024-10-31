import { ElysiaSplash } from "../src/UI/ElysiaSplash.ts";

document.body.style.width = "100%";
document.body.style.height = "100vh";
document.body.style.margin = "0";

if(import.meta.DEV)
{
	new EventSource('/esbuild').addEventListener('change', () => location.reload());
}

const splash = document.createElement("elysia-splash") as ElysiaSplash;

document.body.append(splash);

import("./PlaygroundGame/Game.ts")
	.then(({ scene, app }) => app.loadScene(scene))
	.then(() => setTimeout(() => splash.goodbye(), 2000));

