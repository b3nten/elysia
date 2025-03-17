import { Application } from "../.dist/core/application"
import { Scene } from "../.dist/core/scene";
import { Actor } from "../.dist/core/actor";
import { ThreeRenderer } from "../.dist/three/renderer";
import { CThreeObject, CThreePerspectiveCamera } from "../.dist/three/components";
import * as Three from "three";
import {ThreeScene} from "../.dist/three/scene";

const app = new Application({
    autoUpdate: true,
    renderer: new ThreeRenderer,
    canvas: document.getElementById("mainCanvas") as HTMLCanvasElement,
})

class TestScene extends ThreeScene {
    override onLoad() {
        // camera
        let cameraActor = this.addActor(Actor);
        let cam = cameraActor.addComponent(CThreePerspectiveCamera);
        cam.fov = 75;
        cam.aspect = window.innerWidth / window.innerHeight;
        cam.near = 0.1;
        cam.far = 1000;
        cameraActor.NAME = "camera";
        cameraActor.position.z = 5;

        // // cube
        // let cube = this.add(Actor);
        // cube.addComponent(
        //     CThreeObject,
        //     new Three.Mesh(
        //         new Three.BoxGeometry(1, 1, 1),
        //         new Three.MeshBasicMaterial({ color: "pink" })
        //     )
        // )
        //
        // this.threeRoot.add(
        //     new Three.AmbientLight(0xffffff, 0.5),
        // )
    }
}

app.loadScene(TestScene)
