import { Application } from "../.dist/core/application";

document.body.style.width = "100%";
document.body.style.height = "100vh";
document.body.style.margin = "0";

const USE_WORKER = false;

let canvas = document.createElement("canvas");
canvas.style.width = "100vw"
canvas.style.height = "100vh"
canvas.style.display = "block"
canvas.style.position = "relative"
canvas.style.margin = "0"
canvas.id = "mainCanvas";
document.body.appendChild(canvas);

if(USE_WORKER) {
	Application.startMainThread({
		canvas,
		workers: [new Worker(new URL("./worker.ts", import.meta.url), {
			type: "module"
		})]
	})
} else {
	import("./worker.ts")
}
