import * as Elysia from "../src/mod.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from "three"

const app = new Elysia.Core.Application({
	renderPipeline: new Elysia.RPipeline.HDRenderPipeline({
		smaa: true,
		// fog: new Elysia.RPipeline.ExponentialHeightFog('#323238'),
	}),
	// renderPipeline: new Elysia.RPipeline.BasicRenderPipeline,
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

	sky = new Elysia.Actors.SkyActor();

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
			this.sky.elevation = 30
			this.addComponent(this.sky);
			this.addComponent(new Elysia.Actors.AmbientLightActor);
		}

		{
			const lodGroup = Elysia.Actors.createLodGroup({
				levels: [
					{
						geometry: new Three.SphereGeometry(1, 128, 128),
						material: new Three.MeshStandardMaterial({ color: "blue" }),
						distance: 0
					},
					{
						geometry: new Three.SphereGeometry(1, 64, 64),
						material: new Three.MeshStandardMaterial({ color: "cyan" }),
						distance: 12
					},
					{
						geometry: new Three.SphereGeometry(1, 32, 32),
						material: new Three.MeshStandardMaterial({ color: "yellow" }),
						distance: 30
					},
					{
						geometry: new Three.SphereGeometry(1, 8, 8),
						material: new Three.MeshStandardMaterial({ color: "white" }),
						distance: 60
					},
				],
				maxDrawDistance: 300,
			})

			const mesh = new Three.Mesh(
				new Three.BoxGeometry(2,20,2),
				new Three.MeshStandardMaterial({ color: "red" })
			)

			const cube = new Elysia.Actors.MeshActor(mesh)
			cube.static = true;
			cube.scale.set(20, .5, 1)
			cube.position.set(0, 0, 0);
			this.addComponent(cube);

			const plane = new Elysia.Actors.MeshActor(
				new Three.PlaneGeometry(1000, 1000, 10, 10),
				new Three.MeshStandardMaterial({  })
			)
			plane.static = true;
			plane.position.set(0, -2, 0);
			plane.rotation.setFromEuler(new Three.Euler(-Math.PI / 2, 0, 0));
			this.addComponent(plane);

			// for(let i = 0; i < 2000; i++)
			// {
			//
			// 	const cube = new Elysia.Actors.MeshActor(lodGroup)
			// 	cube.static = true;
			// 	cube.scale.setScalar(2)
			// 	cube.position.set(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50);
			// 	// cube.position.set(Math.random() * 5 - 2.5, Math.random() * 5 - 2.5, Math.random() * 5 - 2.5);
			// 	this.addComponent(cube);
			// }
		}
	}
}

await app.loadScene(new MyScene);
