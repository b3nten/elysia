import { defineConfig } from "vite";
import { join } from "node:path";

export default defineConfig({
	resolve: {
		alias: {
			"elysiatech": join(process.cwd(), "../.dist")
		}
	},
	optimizeDeps: {
		esbuildOptions: {
			target: "es2022",
		},
	},
	build: {
		target: "es2022",
	},
});
