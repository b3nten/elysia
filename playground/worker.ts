import { Application } from "../.dist/core/application"
import { Scene } from "../.dist/core/scene";
import {Actor} from "../.dist/core/actor";
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
    constructor() {
        super()

        this.addComponent(TestComponent)
        this.addComponent(foo)

        setTimeout(() => {
            this.removeComponent(foo)
        }, 50)

        setTimeout(() => {
            this.addComponent(foo)
        }, 100)
    }

    onStart() {
        console.log("Actor started")
    }

    onShutdown() {
        console.log("Actor shutdown")
    }
}

class TestScene extends Scene {
    constructor() {
        super();
        console.log("Scene created")
    }

    override onLoad() {
        console.log("Scene loaded")
        this.add(TestActor)
    }
}

app.loadScene(TestScene)
