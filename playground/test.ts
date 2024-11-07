import * as Elysia from "../src/mod.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from "three"

const app = new Elysia.Core.Application({
	renderPipeline: new Elysia.RPipeline.BasicRenderPipeline,
	stats: true,
})

const assets = new Elysia.Assets.AssetLoader({
	Dummy: new Elysia.Assets.GLTFAsset("/assets/Dummy.glb")
})

class MyScene extends Elysia.Scene.Scene
{
	camera = new Elysia.Actors.PerspectiveCameraActor();

	env = new Elysia.Actors.EnvironmentActor();

	override async onLoad() {
		await assets.load();
	}

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

		{
			const red = 0xff0000;
			const green = 0x00ff00;
			const blue = 0x0000ff;
			const yellow = 0xffff00;

			const randomColor = () => [red,green,blue,yellow].at(Math.floor(Math.random() * 4))

			const randomShape = () => [
				Elysia.Actors.PrimitiveActor.Box,
				Elysia.Actors.PrimitiveActor.Sphere,
				Elysia.Actors.PrimitiveActor.Cone,
				Elysia.Actors.PrimitiveActor.Cylinder,
				Elysia.Actors.PrimitiveActor.Ring,
			].at(Math.floor(Math.random() * 5))!("red");

			const mesh = assets.unwrap("Dummy").clone().children[0] as Three.Mesh;

			for(let i = 0; i < 20000; i++)
			{
				// const cube = new Elysia.Actors.MeshActor(
				// 	mesh.geometry,
				// 	mesh.material
				// )
				const cube = randomShape();
				cube.position.set(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50);
				this.addComponent(cube);
			}
		}
	}
}

await app.loadScene(new MyScene);
