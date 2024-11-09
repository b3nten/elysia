import * as Elysia from "../src/mod.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from "three"

const app = new Elysia.Core.Application({
	renderPipeline: new Elysia.RPipeline.BasicRenderPipeline,
	stats: true,
})

const assets = new Elysia.Assets.AssetLoader({
	Dummy: new Elysia.Assets.GLTFAsset("/assets/Dummy.glb"),
	Fox: new Elysia.Assets.GLTFAsset("/assets/Fox.glb"),
	Box: new Elysia.Assets.GLTFAsset("/assets/Box.glb"),
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
			const lodGroup = Elysia.Actors.createLodGroup({
				levels: [
					{
						geometry: new Three.SphereGeometry(1, 256, 256),
						material: new Three.MeshStandardMaterial({ color: "blue" }),
						distance: 0
					},
					{
						geometry: new Three.SphereGeometry(1, 128, 128),
						material: new Three.MeshStandardMaterial({ color: "cyan" }),
						distance: 20
					},
					{
						geometry: new Three.SphereGeometry(1, 64, 64),
						material: new Three.MeshStandardMaterial({ color: "yellow" }),
						distance: 50
					},
					{
						geometry: new Three.SphereGeometry(1, 16, 16),
						material: new Three.MeshStandardMaterial({ color: "white" }),
						distance: 120
					},
				],
				maxDrawDistance: 300,
			})

			const mesh = new Three.Mesh(
				new Three.SphereGeometry(1, 256, 256),
				new Three.MeshStandardMaterial({ color: "red" })
			)

			for(let i = 0; i < 1; i++)
			{

				const cube = new Elysia.Actors.MeshActor(lodGroup)
				cube.scale.setScalar(1)
				cube.position.set(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50);
				this.addComponent(cube);
			}
		}
	}
}

await app.loadScene(new MyScene);
