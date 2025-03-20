import { Application } from "elysiatech/core/application"
import { Scene } from "elysiatech/core/scene";
import { makeNew } from "elysiatech/core/new";
import { DevRenderer } from "elysiatech/renderer/dev";
import { Actor } from "elysiatech/core/actor";
import { LogLevel } from "elysiatech/log/mod";
import { Component } from "elysiatech/core/component";

let renderer = makeNew(DevRenderer)
renderer._logger.level = LogLevel.Error;

const app = new Application({
    renderer,
    canvas: document.getElementById("mainCanvas") as HTMLCanvasElement,
    autoUpdate: true,
})

class TestComponent extends Component {
    protected onStartup() {
        console.log("Component onStartup")
    }

    protected onUpdate(delta: number, elapsed: number) {
        console.log("Component onUpdate", delta, elapsed)
    }

    protected onShutdown() {
        console.log("Component onShutdown")
    }
}

class TestActor extends Actor {
    constructor() {
        super();
        console.log("Actor constructor")
    }

    protected onStartup() {
        console.log("Actor onStartup")
        this.addComponent(makeNew(TestComponent))

        setTimeout(() => {
            this.removeComponent(TestComponent)
        })
    }

    protected onShutdown() {
        console.log("Actor onShutdown")
    }

    protected onUpdate(delta: number, elapsed: number) {
        console.log("Actor onUpdate", delta, elapsed)
    }
}

class TestScene extends Scene {
    constructor() {
        super();
        let a = makeNew(TestActor);
        this.addChild(a)

        setTimeout(() => {
            a.destroy()
        }, 100)
    }
    protected onUpdate(delta: number, elapsed: number) {
        // console.log("Scene onUpdate", delta, elapsed)
    }
}

app.loadScene(TestScene)
    .catch(console.error)
