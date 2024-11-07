import * as Elysia from "../src/mod.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from "three"

const app = new Elysia.Core.Application({
	renderPipeline: new Elysia.RPipeline.BasicRenderPipeline,
	stats: true,
})

class MyScene extends Elysia.Scene.Scene
{
	cube = new Elysia.Scene.ThreeActor(
		new Three.Mesh(new Three.BoxGeometry(), new Three.MeshBasicMaterial({ color: 0xff0000 })))

	camera = new Elysia.Actors.PerspectiveCameraActor();

	override onCreate()
	{
		this.camera.position.z = 5;
		this.activeCamera = this.camera;
		this.camera.addComponent(new Elysia.Behaviors.CameraOrbitBehavior);
		this.addComponent(this.camera);

		this.cube.position.y = 2;
		this.addComponent(this.cube);

		const cube2 = new Elysia.Scene.ThreeActor(
			new Three.Mesh(new Three.BoxGeometry(), new Three.MeshBasicMaterial({ color: "green" })))

		cube2.scale.setScalar(0.5)
		cube2.position.y = -3
		this.cube.addComponent(cube2)
	}

	euler = new Three.Euler();

	override onUpdate()
	{
		this.euler.x += 0.01;
		this.euler.y += 0.01;
		this.euler.z += 0.01;
		// this.cube.rotation.setFromEuler(this.euler);
	}
}

await app.loadScene(new MyScene);
