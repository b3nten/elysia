import * as Elysia from "../src/mod.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from "three"
import {PhysicsBody} from "../src/Jolt/PhysicsBody.ts";
import {PhysicsLayer} from "../src/Jolt/PhysicsLayer.ts";
import {Player} from "../src/Actors/Player.ts";
import {PhysicsWorldComponent} from "../src/Jolt/PhysicsWorldComponent.ts";
import {MouseCode} from "../src/Input/MouseCode.ts";

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

class ShootBallBehavior extends Elysia.Core.Behavior
{

	static Geometry = new Three.SphereGeometry(0.5, 16, 16);
	static Material = new Three.MeshStandardMaterial({ color: 0x0000ff });

	override onCreate()
	{
		this.app.input.onKeyDown(MouseCode.MouseLeft, () => {
			const Jolt = (this.scene.physics as unknown as PhysicsWorldComponent).getJoltInstance()!;
			const ball = new Elysia.Actors.Mesh(ShootBallBehavior.Geometry, ShootBallBehavior.Material);
			ball.scale.setScalar(0.1);
			this.scene.activeCamera.getWorldPosition(ball.position);
			ball.position.add(this.scene.activeCamera.getWorldDirection(new Three.Vector3).multiplyScalar(2));
			const massSettings = new Jolt.MassProperties;
			massSettings.set_mMass(5);
			const body = (new PhysicsBody({
				objectLayer: PhysicsLayer.Dynamic,
				motionType: Jolt.EMotionType_Dynamic,
				shape: new Jolt.SphereShape(0.05),
				friction: 20,
				restitution: 0.5,
				motionQuality: Jolt.EMotionQuality_LinearCast,
				overrideMassProperties: Jolt.EOverrideMassProperties_CalculateInertia,
				massPropertiesOverride: massSettings,
			}))
			ball.addComponent(body);
			this.scene.addComponent(ball);
			(this.scene.physics as unknown as PhysicsWorldComponent).world!.bodyInterface.AddImpulse(body.joltBodyID!, new Jolt.Vec3(
				this.scene.activeCamera.getWorldDirection(new Three.Vector3).x * 400,
				this.scene.activeCamera.getWorldDirection(new Three.Vector3).y * 400,
				this.scene.activeCamera.getWorldDirection(new Three.Vector3).z * 400,
			));
		})
	}
}

class MyScene extends Elysia.Core.Scene
{
	override physics = new PhysicsWorldComponent;

	camera = new Elysia.Actors.PerspectiveCamera;

	player = new Player;

	sky = new Elysia.Actors.Sky;

	override onCreate()
	{
		const joltWorld = this.physics.world;
		const Jolt = this.physics.getJoltInstance();
		// this.physics.debug = true;

		if(!Jolt || !joltWorld) throw new Error("Jolt physics engine not initialized. Call `await JoltBehavior.Init()` before using Jolt!");

		// camera
		{
			// this.camera.position.z = 1;
			// this.camera.position.y = 0;
			// this.activeCamera = this.camera;
			// this.camera.addComponent(new Elysia.Behaviors.OrbitControls);
			// this.addComponent(this.camera);
		}

		// sky
		{
			this.sky.elevation = 30
			this.addComponent(this.sky);
			this.addComponent(new Elysia.Actors.AmbientLight);
		}

		// cube
		// {
		// 	const cube = new Elysia.Actors.Mesh(new Three.BoxGeometry(1, 1, 1), new Three.MeshStandardMaterial({ color: 0x00ff00 }))
		//
		// 	cube.position.y = 5;
		//
		// 	const cubeBodySettings = new Jolt.BodyCreationSettings;
		// 	cubeBodySettings.SetShape(new Jolt.BoxShape(new Jolt.Vec3(.5, .5, .5), 0.05, undefined))
		// 	cubeBodySettings.set_mObjectLayer(PhysicsLayer.Dynamic);
		// 	cubeBodySettings.set_mMotionType(Jolt.EMotionType_Dynamic);
		// 	cubeBodySettings.mRestitution = 0.5;
		// 	cube.addComponent(new PhysicsBodyBehavior({ bodyCreationSettings: cubeBodySettings }))
		//
		// 	this.addComponent(cube);
		// }

		const boxGeo = new Three.BoxGeometry(1, 1, 1);
		const boxMat = new Three.MeshStandardMaterial({ color: 0x00ff00 });
		for(let w = 0; w <1; w++)
		{
			for(let l = 0; l < 1; l++)
			{
				for(let h = 0; h < 1; h++)
				{
					const cube = new Elysia.Actors.Mesh(boxGeo, boxMat);
					cube.position.set(w + 1, h + 1 + 10, l + 1);
					const mass = new Jolt.MassProperties;
					mass.set_mMass(1)
					cube.addComponent(new PhysicsBody({
						objectLayer: PhysicsLayer.Dynamic,
						motionType: Jolt.EMotionType_Dynamic,
						shape: new Jolt.BoxShape(new Jolt.Vec3(.5, .5, .5), 0.05, undefined),
						restitution: 0.5,
						massPropertiesOverride: mass,
						overrideMassProperties: Jolt.EOverrideMassProperties_CalculateInertia,
					}))
					this.addComponent(cube);
				}
			}
		}

		this.physics.world!.physicsSystem.OptimizeBroadPhase();

		// floor
		{
			const floor = new Elysia.Actors.Mesh(new Three.Mesh(new Three.BoxGeometry(200, 2, 200), new Three.MeshStandardMaterial({ color: 0xff0000 })))
			floor.position.y = -3;

			floor.addComponent(new PhysicsBody({
				objectLayer: PhysicsLayer.Static,
				motionType: Jolt.EMotionType_Static,
				shape: new Jolt.BoxShape(new Jolt.Vec3(100, 1, 100), 0.05, undefined),
				friction: 200,
			}))

			this.addComponent(floor);
		}

		// player
		{
			const player = this.player;
			this.activeCamera = player.camera;
			const shootBall = new ShootBallBehavior;
			player.addComponent(shootBall);
			this.addComponent(player);

			player.position.y = 2
			player.position.x = -40
		}
	}

}

await app.loadScene(new MyScene);
