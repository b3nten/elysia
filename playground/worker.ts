import { Application } from "../.dist/core/application"
import { Scene } from "../.dist/core/scene";
import { Actor } from "../.dist/core/actor";
import { Component, type IComponent } from "../.dist/core/component";

const app = new Application({
    autoUpdate: true,
    renderer: undefined,
    canvas: undefined,
})

class TestComponent extends Component {
    onStart() {
        console.log("Component started")
    }
    onShutdown() {
        console.log("Component shutdown")
    }
}

let foo: IComponent = {
    onStart() {
        console.log("foo started")
    },
    onShutdown() {
        console.log("foo shutdown")
    }
}

class TestActor extends Actor {
    onStart() {
        console.log("Actor started")
        let t = this.addComponent(TestComponent)
        this.addComponent(foo)

        setTimeout(() => {
            this.removeComponent(foo)
            t.destructor();
            this.addComponent(t)
        }, 2000)
    }

    onShutdown() {
        console.log("Actor shutdown")
    }
}

class TestScene extends Scene {
    override onLoad() {
        console.log("Scene loaded")
        this.add(TestActor)
    }
}

app.loadScene(TestScene)
