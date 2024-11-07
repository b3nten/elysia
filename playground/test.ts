import * as Elysia from "../src/mod.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from "three"

const app = new Elysia.Core.Application({
	renderPipeline: new Elysia.RPipeline.BasicRenderPipeline,
	stats: true,
})

class MyScene extends Elysia.Scene.Scene
{
	camera = new Elysia.Actors.PerspectiveCameraActor();

	env = new Elysia.Actors.EnvironmentActor();

	cube = new Elysia.Actors.CubeActor;

	override onCreate()
	{
		{
			this.camera.position.z = 5;
			this.activeCamera = this.camera;
			this.camera.addComponent(new Elysia.Behaviors.CameraOrbitBehavior);
			this.addComponent(this.camera);
		}

		{
			this.env.background = true;
			this.env.backgroundBlur = 3;
			this.addComponent(this.env);
		}

		this.addComponent(this.cube);

		{
			for(let i = 0; i < 20000; i++)
			{
				const cube = new Elysia.Actors.CubeActor;
				cube.position.set(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50);
				this.addComponent(cube);
			}
		}
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
