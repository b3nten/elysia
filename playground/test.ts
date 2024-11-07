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
		new Three.Mesh(new Three.BoxGeometry(), new Three.MeshStandardMaterial({ color: 0xff0000 })))

	camera = new Elysia.Actors.PerspectiveCameraActor();

	env = new Elysia.Actors.EnvironmentActor();

	override onCreate()
	{
		this.camera.position.z = 5;
		this.activeCamera = this.camera;
		this.camera.addComponent(new Elysia.Behaviors.CameraOrbitBehavior);
		this.addComponent(this.camera);

		this.cube.position.y = 2;
		this.addComponent(this.cube);

		const cube2 = new Elysia.Scene.ThreeActor(
			new Three.Mesh(new Three.BoxGeometry(), new Three.MeshStandardMaterial({ color: "green" })))

		cube2.scale.setScalar(0.5)
		cube2.position.y = -3
		this.cube.addComponent(cube2)

		this.env.background = true;
		this.env.backgroundBlur = 3;
		this.addComponent(this.env);
	}

	euler = new Three.Euler();

	override onUpdate(d: number)
	{
		this.euler.x += 0.1 * d;
		this.euler.y += 0.1 * d;
		this.euler.z += 0.1 * d;
		this.cube.rotation.setFromEuler(this.euler);
	}
}

await app.loadScene(new MyScene);
