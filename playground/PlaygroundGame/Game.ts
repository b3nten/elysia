import { Application } from "../../src/Core/ApplicationEntry.ts";
import { Scene } from "../../src/Scene/Scene.ts";
import { DirectionalLightActor } from "../../src/Actors/DirectionalLightActor.ts";
import { HighDefRenderPipeline } from "../../src/RPipeline/HighDefRenderPipeline.ts";
import { SkyActor, SkyDirectionalLightTag } from "../../src/Actors/SkyActor.ts";
import { Colors } from "../../src/Core/Colors.ts";
import { ElysiaCrossHair } from "../../src/UI/ElysiaCrossHair.ts";
import { PlaygroundPlayer } from "./Player.ts"
import { Map } from "./Map.ts";
import { playgroundAssets } from "./Assets.ts";
import "../../src/UI/ElysiaCrossHair.ts"
import { PhysicsWorld } from "../../src/Physics/PhysicsWorld.ts";
import { Actor } from "../../src/Scene/Actor.ts";
import { Behavior } from "../../src/Scene/Behavior.ts";

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
}

const crosshair = document.createElement("elysia-crosshair") as ElysiaCrossHair;
crosshair.color = Colors.Green;
crosshair.thickness = 2;
crosshair.visible = true;
document.body.appendChild(crosshair)

const scene = new PlaygroundScene;

export { scene, app };