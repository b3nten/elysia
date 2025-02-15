import { Input } from "../.dist/input/mod"
import { registerWorkers } from "../.dist/core/worker";
import "../.dist/core/application";

const USE_WORKER = false;

if(USE_WORKER) {
	registerWorkers(
		new Worker(new URL('./worker.ts', import.meta.url), {
			type: "module"
		})
	);
} else {
	import("./worker.ts")
}
