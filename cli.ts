import * as fs from "node:fs/promises";
import * as esbuild from "npm:esbuild"
import { copy } from "npm:esbuild-plugin-copy";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@^0.11.0"

const createPlaygroundEsbuildConfig = (mode: string): esbuild.BuildOptions => ({
	entryPoints: ["./playground/entry.ts"],
	outdir: "./playground/dist",
	bundle: true,
	target: "ES2022",
	format: "esm",
	minify: false,
	conditions: ["browser"],
	treeShaking: true,
	metafile: true,
	splitting: true,
	sourcemap: "linked",
	// external: ["three"],
	entryNames: mode === 'build' ? "[name]-[hash]" : undefined,
	define: {
		"import.meta.DEV": mode === "dev" ? "true" : "false",
	},
	logLevel: "error",
	plugins: [
		...denoPlugins(),
		copy({
			resolveFrom: 'cwd',
			assets: {
				from: ['./playground/assets/*'],
				to: ['./playground/dist/assets'],
			},
			watch: true,
		}),
	],
})

const constructPlaygroundHtml = (entry: string) => `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Elysia Playground</title>
	<script type="module" src="${entry}"></script>
</head>
<body></body>
</html>`

async function main()
{
	switch(Deno.args[0])
	{
		case "dev":
		{
			const t = performance.now()
			await fs.mkdir("playground/dist", {recursive: true})
			await fs.writeFile("playground/dist/index.html", constructPlaygroundHtml("entry.js"))
			const ctx = await esbuild.context(createPlaygroundEsbuildConfig("dev"))
			await ctx.watch()
			await ctx.serve({
				servedir: 'playground/dist',
				fallback: 'playground/dist/index.html',
			})
			console.log(`Dev server started in ${(performance.now() - t).toFixed(1)} ms`)
			break
		}
		case "playground:build":
		{
			console.info("Building playground for production")
			const t = performance.now()
			try { await fs.rm("playground/dist", {recursive: true}) } catch { /**/ }
			const output = await esbuild.build(createPlaygroundEsbuildConfig("build"))
			const path = Object.entries(output.metafile!.outputs).find(([p, lol]) => lol.entryPoint === 'playground/entry.ts')
			await fs.writeFile("playground/dist/index.html", constructPlaygroundHtml(path![0].replace('playground/dist', '')))
			console.log(`Built in ${(performance.now() - t).toFixed(1)} ms`)
			break
		}
		case "playground:deploy":
		{
			console.log("Deploying playground to Deno Deploy")
			break
		}
		default:
			console.log(
				`Usage: cli <command>\n\n`,
				`playground:dev     Start playground development server\n`,
				`playground:build   Build playground for production\n`,
				`playground:deploy  Deploy playground to Cloudflare Pages\n`
			)
	}
}

main().catch(console.error)
