import { serveDir } from "jsr:@std/http@1.0.9";
import { parseArgs } from "jsr:@std/cli@1.0.6/parse-args";
import type esbuild from "npm:esbuild@0.24.0"
import { AutoRouter } from 'npm:itty-router@5.0.18';

const args = parseArgs(Deno.args)

const shell = (entry: string) => `
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

const headers = {
	"Cross-Origin-Opener-Policy": "same-origin",
	"Cross-Origin-Embedder-Policy": "require-corp",
	toArray(): string[]
	{
		const headers = []
		for(const [key, value] of Object.entries(this))
		{
			if(typeof value === "string")
			{
				headers.push(`${key}: ${value}`)
			}
		}
		return headers
	},
	toObject(): { [p: string]: string }
	{
		const headers: { [p: string]: string } = {}
		for(const [key, value] of Object.entries(this))
		{
			if(typeof value === "string")
			{
				headers[key] = value
			}
		}
		return headers
	}
}

const router = AutoRouter()

let rebuild = async () => {};

if(args.dev || args.build)
{
	const esbuild = await import("npm:esbuild").then(m => m.default)
	const denoPlugins = await import("jsr:@luca/esbuild-deno-loader@^0.11.0").then(m => m.denoPlugins)

	const createEsbuildConfig = (mode: string): esbuild.BuildOptions => ({
		entryPoints: ["./entry.ts"],
		outdir: "./dist",
		bundle: true,
		target: "ES2022",
		format: "esm",
		minify: true,
		conditions: ["browser"],
		treeShaking: true,
		splitting: true,
		sourcemap: "linked",
		metafile: true,
		define: {
			"DEFINE_IS_DEV": mode === "dev" ? "true" : "false",
		},
		logLevel: "error",
		plugins: [
			...denoPlugins(),
		],
	})

	if(args.dev)
	{
		const ctx = await esbuild.context(createEsbuildConfig("dev"))

		rebuild = async () => {
			await Deno.remove("./dist", { recursive: true })
			await ctx.rebuild()
		}

		router.get("/metafile.json", async () => {
			const build = await esbuild.build(createEsbuildConfig("dev"))
			return new Response(JSON.stringify(build.metafile), {
				headers: {
					...headers.toObject(),
					"Content-Type": "application/json",
					"Content-Disposition": "attachment; filename=metafile.json"
				}
			})
		})

		Deno.addSignalListener("SIGTERM",
			async () => {
				await ctx.dispose()
				Deno.exit()
			}
		)
	}
	else if (args.build)
	{
		await esbuild.build(createEsbuildConfig("build"))
		Deno.exit(0);
	}
}


router.get("/",
	() => new Response(
		shell("/entry.js"),
		{
			headers: {
				"Content-Type": "text/html",
				...headers.toObject(),
			}
		}
	))

router.get("/entry.js", async () => {
	await rebuild()
	return new Response(
		await Deno.readTextFile("./dist/entry.js"),
		{
			headers: {
				"Content-Type": "application/javascript",
				...headers.toObject(),
			}
		}
	)
})

// serve assets
router.get("*", async (request) =>
{
	let res = await serveDir(request, { fsRoot: "assets", headers: headers.toArray(), quiet: false });
	if(res.status >= 400) res = await serveDir(request, { fsRoot: "dist", headers: headers.toArray(), quiet: false })
	return res
})

export default { fetch: router.fetch }
