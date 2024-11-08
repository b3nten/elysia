import * as Elysia from "../src/mod.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from "three"
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const app = new Elysia.Core.Application({
	renderPipeline: new Elysia.RPipeline.BasicRenderPipeline,
	stats: true,
})

const assets = new Elysia.Assets.AssetLoader({
	Dummy: new Elysia.Assets.GLTFAsset("/assets/Dummy.glb"),
	Magnum: new Elysia.Assets.GLTFAsset("/assets/Uzi.glb"),
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

			const mesh = assets.unwrap("Box").clone().children[0] as Three.Group;

			for(let i = 0; i < 10000; i++)
			{
				// const cube = new Elysia.Scene.ThreeActor(
				// 	mesh.clone(true)
				// )
				const cube = new Elysia.Actors.MeshActor(
					mesh
				)
				cube.position.set(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50);
				this.addComponent(cube);
			}
		}
	}
}

await app.loadScene(new MyScene);
