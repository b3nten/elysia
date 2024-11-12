import { Behavior } from "../../src/Core/Behavior.ts";
import { MouseCode } from "../../src/Input/MouseCode.ts";
import { SphereActor } from "../../src/Actors/PrimitiveMeshActor.ts";
// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three';
import { RigidBody, RigidbodyType } from "../../src/Physics/RigidBody.ts";
import { SphereCollider } from "../../src/Physics/Collider.ts";
import { OutOfBoundsBehavior } from "./OutOfBoundsBehavior.ts";
import { tick } from "../../src/Shared/Utilities.ts"

export class ProjectileBehavior extends Behavior
{
	onCreate() {
		this.app!.input!.onKeyDown(MouseCode.MouseLeft, () => this.shoot())
	}

	private shoot()
	{
		if(!this.parent || !this.scene) return;

		const camera = this.scene.getActiveCamera();

		// create our ball
		const actor = new SphereActor;
		actor.position.copy(camera.getWorldPosition(new Three.Vector3))
		actor.position.add(camera.getWorldDirection(new Three.Vector3).multiplyScalar(2));
		actor.material.color = new Three.Color("red");
		actor.scale.setScalar(0.1);

		// Calculate the forward vector of the camera using its world matrix
		const cameraForward = new Three.Vector3;
		camera.getWorldDirection(cameraForward);
		// Ensure the forward vector is normalized (although getWorldDirection should return a normalized vector)
		cameraForward.normalize();

		const rb = new RigidBody(RigidbodyType.Dynamic);
		rb.mass = 2;
		const col = new SphereCollider(.1);

		// Apply velocity in the camera's forward direction
		rb.ccdEnabled = true;
		// shoot!
		tick(() => {
			rb.applyImpulse(cameraForward.multiplyScalar(50));
		})

		actor.addComponent(rb);
		actor.addComponent(col);
		actor.addComponent(new OutOfBoundsBehavior);

		this.scene.addComponent(actor);
	}
}