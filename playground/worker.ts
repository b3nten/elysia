import { Application } from "../.dist/core/application"
import { Scene } from "../.dist/core/scene";
import { Actor } from "../.dist/core/actor";
import { Component } from "../.dist/core/component";

const app = new Application({
    autoUpdate: true,
    renderer: undefined,
    canvas: undefined,
})

class TestComponent extends Component {
    onStartup() {
        console.log("Component started")
    }
    onResize(width: number, height: number) {
        console.log("Component resized", width, height)
    }
    onShutdown() {
        console.log("Component shutdown")
    }
}

class ChildActor extends Actor {
    constructor() {
        super()
        this.addTag("foo")
    }
}

class TestActor extends Actor {
    onStartup() {
        console.log("Actor started");

        this.addComponent(TestComponent);
        this.addChild(ChildActor)
    }

    onUpdate() {
        console.log(
            this.getViaTag("foo")
        )
    }

    onShutdown() {
        console.log("Actor shutdown")
    }
}

class TagTestActor extends Actor {
    onUpdate() {
        this.scene.getByTag("foo")?.forEach((actor) => {
            console.log("scene: Actor with tag foo found", actor)
        })
    }
}

class TestScene extends Scene {
    override onLoad() {
        console.log("Scene loaded")
        this.add(TestActor)
        this.add(TagTestActor)
    }
}

app.loadScene(TestScene)
