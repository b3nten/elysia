import { Input } from "../.dist/input/mod"
import { registerWorkers } from "../.dist/core/worker";

Input.init()

registerWorkers(
	new Worker(new URL('./worker.ts', import.meta.url), {
		type: "module"
	})
);
