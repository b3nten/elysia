import * as Esbuild from 'esbuild';

const createEsbuildConfig = mode => ({
    entryPoints: ["./src/**/*.ts"],
    outdir: "./dist",
    bundle: false,
    target: "ES2022",
    format: "esm",
    conditions: ["browser"],
})

const build = async (mode) => {
    const config = createEsbuildConfig(mode);
    const result = await Esbuild.build(config);
    if (result.errors.length) {
        console.error(result.errors);
        process.exit(1);
    }
}

build(process.env.NODE_ENV);