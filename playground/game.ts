import * as Elysia from "../src/mod.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from "three"
import { JoltPhysicsWorldComponent, PhysicsBodyBehavior } from "../src/Jolt/JoltBehavior.ts";
import { PhysicsBodyType } from "../src/Jolt/PhysicsBodyType.ts";
import { PhysicsLayer } from "../src/Jolt/PhysicsLayer.ts";
import { JoltWorld } from "../src/Jolt/JoltWorld.ts";

const assets = new Elysia.Assets.AssetLoader({
	Dummy: new Elysia.Assets.GLTFAsset("/Dummy.glb"),
	Fox: new Elysia.Assets.GLTFAsset("/Fox.glb"),
	Box: new Elysia.Assets.GLTFAsset("/Box.glb"),
})

const app = new Elysia.Core.Application({
	renderPipeline: new Elysia.Rendering.HDRenderPipeline({
		smaa: true,
	}),
	stats: true,
	assets,
})

class MyScene extends Elysia.Core.Scene
{
	override physics = new JoltPhysicsWorldComponent;

	camera = new Elysia.Actors.PerspectiveCamera;

	sky = new Elysia.Actors.Sky;

	override onCreate()
	{
		const joltWorld = this.physics.world;
		const Jolt = this.physics.getJoltInstance();
		this.physics.debug = true;

		if(!Jolt || !joltWorld) throw new Error("Jolt physics engine not initialized. Call `await JoltBehavior.Init()` before using Jolt!");

		{
			this.camera.position.z = 5;
			this.activeCamera = this.camera;
			this.camera.addComponent(new Elysia.Behaviors.OrbitControls);
			this.addComponent(this.camera);
		}

		{
			this.sky.elevation = 30
			this.addComponent(this.sky);
			this.addComponent(new Elysia.Actors.AmbientLight);
		}

		{
			const cube = new Elysia.Actors.Mesh(new Three.BoxGeometry(1, 1, 1), new Three.MeshStandardMaterial({ color: 0x00ff00 }))

			cube.position.y = 5;

			const cubeBodySettings = new Jolt.BodyCreationSettings;
			cubeBodySettings.SetShape(new Jolt.BoxShape(new Jolt.Vec3(.5, .5, .5), 0.05, undefined))
			cubeBodySettings.mObjectLayer = PhysicsLayer.Dynamic;
			cubeBodySettings.mMotionType = Jolt.EMotionType_Dynamic;
			cubeBodySettings.mRestitution = 0.5;
			cubeBodySettings.set_mAllowDynamicOrKinematic(true)
			cube.addComponent(new PhysicsBodyBehavior({ bodyCreationSettings: cubeBodySettings }))

			this.addComponent(cube);
		}

		{
			const floor = new Elysia.Actors.Mesh(new Three.BoxGeometry(100, .5, 100), new Three.MeshStandardMaterial({ color: 0xff0000 }))

			floor.position.set(0, -.75, 0);

			const floorBodySettings = new Jolt.BodyCreationSettings;
			floorBodySettings.SetShape(new Jolt.BoxShape(new Jolt.Vec3(50, .25, 50), 0.05, undefined))
			floorBodySettings.mObjectLayer = PhysicsLayer.Static;
			floorBodySettings.mMotionType = Jolt.EMotionType_Static;
			floorBodySettings.set_mAllowDynamicOrKinematic(true)
			floorBodySettings.mRestitution = 0.5;
			floor.addComponent(new PhysicsBodyBehavior({ bodyCreationSettings: floorBodySettings }))

			this.addComponent(floor);
		}
	}

	override onUpdate()
	{
		for(const body of this.getComponentsByType(PhysicsBodyBehavior))
		{
			const id = body.joltBodyID;
			const bodyInterface = this.physics.world!.bodyInterface;
			if(!id || !bodyInterface) continue;


			const verts = bodyInterface.GetShape(id)
		}
	}
}

await app.loadScene(new MyScene);
