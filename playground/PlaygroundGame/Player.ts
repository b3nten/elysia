import { FirstPersonActor } from "../../src/Actors/FirstPersonActor.ts";
import { ProjectileBehavior } from "./ProjectileBehavior.ts";

export class PlaygroundPlayer extends FirstPersonActor
{
	onCreate() {
		super.onCreate()
		this.scene.activeCamera = this.camera;
		this.camera.fov = 75;
		this.position.set(10, 2, 10);
		this.addComponent(new ProjectileBehavior);
	}
}

