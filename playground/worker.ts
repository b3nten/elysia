import { Application } from "../.dist/core/application"

console.log("worker.ts")

const app = new Application({
    autoUpdate: true,
})

app.loadScene()