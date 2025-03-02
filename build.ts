import * as esbuild from "esbuild"

// @ts-expect-error
let args = process.argv.slice(2)

export let build = async (args: { defines: Record<string, any>, drop: string[] }) => {
	let exclude = ["three"]
	await esbuild.build({
		entryPoints: ["src/**/*.ts"],
		bundle: true,
		outdir: ".dist",
		format: "esm",
		platform: "browser",
		define: args.defines,
		dropLabels: args.drop,
		treeShaking: true,
		target: ["es2022"],
		plugins: [{
			name: 'resolve-ext',
			setup(build) {
				build.onResolve({ filter: /.*/ }, args => {
					if(exclude.includes(args.path)) return {
						path: args.path,
						external: true
					}
					if (args.importer)
						return { path: args.path.replace(".ts", "") + '.js', external: true }
					else return { path: args.path, external: true }
				})
			},
		}],
	})
}

let mode = args.includes("--prod") ? "production" : "development"

console.info(`Building in ${mode} mode...`)

let t = performance.now()

if(mode === "production") {
	await build({
		defines: {
			ELYSIA_DEV: "false",
			ELYSIA_PROD: "true",
		},
		drop: ["ELYSIA_DEV"],
	})
} else {
	await build({
		defines: {
			ELYSIA_DEV: "true",
			ELYSIA_PROD: "false",
		},
		drop: ["ELYSIA_PROD"],
	})
}

console.info(`Built in ${(performance.now() - t).toFixed(0)}ms`)
