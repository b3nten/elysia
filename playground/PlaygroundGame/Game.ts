import { Application } from "../../src/Core/Application.ts";
import { Scene } from "../../src/Core/Scene.ts";
import { DirectionalLightActor } from "../../src/Actors/DirectionalLightActor.ts";
import { HighDefRenderPipeline } from "../../src/Rendering/HighDefRenderPipeline.ts";
import { SkyActor, SkyDirectionalLightTag } from "../../src/Actors/SkyActor.ts";
import { Colors } from "../../src/Shared/Colors.ts";
import { ElysiaCrossHair } from "../../src/UI/ElysiaCrossHair.ts";
import { PlaygroundPlayer } from "./Player.ts"
import { Map } from "./Map.ts";
import { playgroundAssets } from "./Assets.ts";
import "../../src/UI/ElysiaCrossHair.ts"
import { PhysicsWorld } from "../../src/Physics/PhysicsWorld.ts";
import { PointLight, Transform } from "../../src/ECS/Component.ts";

const app = new Application({
	renderPipeline: new HighDefRenderPipeline({
		ssao: {
			intensity: 2,
			aoRadius: 0.5,
			halfResolution: true,
			qualityMode: "Ultra",
		}
	}),
	stats: true,
	assets: playgroundAssets,
});

class PlaygroundScene extends Scene {

	override onLoad(): void | Promise<void> {
		this.physics = new PhysicsWorld({ debug: false })
	}

	override onCreate() {
		this.ambientLight.intensity = .8;

		const dirLight = new DirectionalLightActor()
		dirLight.addTag(SkyDirectionalLightTag)
		this.addComponent(dirLight);

		const sky = new SkyActor
		sky.elevation = 25
		sky.turbidity = 1.1;
		sky.mieCoefficient = 0.03;
		sky.mieDirectionalG = 0.99;
		sky.rayleigh = 0.6;
		this.addComponent(sky)

		this.addComponent(new PlaygroundPlayer)

		this.addComponent(new Map)
	}

	override onStart() {
		let entity = this.ecs.addEntity();
		const light = new PointLight;
		light.intensity = 20;
		const transform = new Transform;
		transform.posY = 2;

		this.ecs.addComponent(entity, light);
		this.ecs.addComponent(entity, transform);
	}
}

const crosshair = document.createElement("elysia-crosshair") as ElysiaCrossHair;
crosshair.color = Colors.Green;
crosshair.thickness = 2;
crosshair.visible = true;
document.body.appendChild(crosshair)

const scene = new PlaygroundScene;

export { scene, app };