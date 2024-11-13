import * as Elysia from "../src/mod.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from "three"
import { JoltPhysicsBehavior } from "../src/Jolt/JoltBehavior.ts";
import { PhysicsBodyBehavior } from "../src/Jolt/JoltBehavior.ts";

const app = new Elysia.Core.Application({
	renderPipeline: new Elysia.Rendering.HDRenderPipeline({
		smaa: true,
	}),
	stats: true,
})

const assets = new Elysia.Assets.AssetLoader({
	Dummy: new Elysia.Assets.GLTFAsset("/Dummy.glb"),
	Fox: new Elysia.Assets.GLTFAsset("/Fox.glb"),
	Box: new Elysia.Assets.GLTFAsset("/Box.glb"),
})

class MyScene extends Elysia.Core.Scene
{
	override physics = new JoltPhysicsBehavior;

	camera = new Elysia.Actors.PerspectiveCameraActor();

	sky = new Elysia.Actors.SkyActor();

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
			const plane = new Elysia.Actors.MeshActor(
				new Three.PlaneGeometry(100, 100, 10, 10),
				new Three.MeshStandardMaterial({  })
			)
			plane.static = true;
			plane.position.set(0, -2, 0);
			plane.rotation.setFromEuler(new Three.Euler(-Math.PI / 2, 0, 0));
			this.addComponent(plane);
		}

		{
			const cube = new Elysia.Actors.MeshActor(
				new Three.BoxGeometry(1, 1, 1),
				new Three.MeshStandardMaterial({ color: 0x00ff00 })
			)
			cube.addComponent(new PhysicsBodyBehavior);
			this.addComponent(cube);
			console.log(cube)
		}
	}
}

await app.loadScene(new MyScene);
