// @ts-types="npm:@types/three@^0.169"
import * as Three from "three";
import { Actor } from "../Core/Actor.ts";
import { FirstPersonCamera } from "../Behaviors/FirstPersonCamera.ts";
import { PerspectiveCamera } from "./PerspectiveCamera.ts";
import type { PhysicsWorldComponent } from "../Jolt/PhysicsWorldComponent.ts";
import { VirtualCharacter } from "../Jolt/VirtualCharacter.ts";
import type Jolt from "jolt-physics/wasm-multithread";
import { KeyCode } from "../Input/KeyCode.ts";
import { ASSERT } from "../Shared/Asserts.ts";

const wrapQuat = (q: Jolt.Quat) =>
	new Three.Quaternion(q.GetX(), q.GetY(), q.GetZ(), q.GetW());
const wrapVec3 = (v: Jolt.Vec3 | Jolt.RVec3) =>
	new Three.Vector3(v.GetX(), v.GetY(), v.GetZ());

export class Player extends Actor {
	camera: PerspectiveCamera = new PerspectiveCamera();
	firstPersonCamera: FirstPersonCamera = new FirstPersonCamera();
	character?: VirtualCharacter;
	shape?: Jolt.Shape;

	controlMovementInAir = true;
	desiredVelocity = new Three.Vector3();
	characterSpeed = 6;
	jumpSpeed = 5;

	override onCreate() {
		// setup camera
		this.camera.addComponent(this.firstPersonCamera);
		this.camera.position.y = 1.5;
		this.addComponent(this.camera);

		// setup virtual character
		const Jolt = (
			this.scene.physics as unknown as PhysicsWorldComponent
		)?.getJoltInstance();
		if (!Jolt)
			throw new Error(
				"Jolt physics engine not initialized when trying to create a Player.",
			);

		const characterHeightStanding = 2;
		const characterRadiusStanding = 1;
		const rotation = Jolt.Quat.prototype.sIdentity();
		const positionStanding = new Jolt.Vec3(
			0,
			0.5 * characterHeightStanding + characterRadiusStanding,
			0,
		);
		this.shape = new Jolt.RotatedTranslatedShapeSettings(
			positionStanding,
			rotation,
			new Jolt.CapsuleShapeSettings(
				0.5 * characterHeightStanding,
				characterRadiusStanding,
			),
		)
			.Create()
			.Get();
		this.character = new VirtualCharacter({
			shape: this.shape,
		});
		this.addComponent(this.character);
	}

	override onBeforePhysicsUpdate(delta: number, elapsed: number): void {
		const physics = this.scene.physics as unknown as PhysicsWorldComponent;
		const Jolt = (
			this.scene.physics as unknown as PhysicsWorldComponent
		)?.getJoltInstance()!;
		const _tmpVec3 = new Jolt.Vec3();

		const input = this.app.input;
		let forward = input.isDown(KeyCode.W)
			? 1.0
			: input.isDown(KeyCode.S)
				? -1.0
				: 0.0;
		let right = input.isDown(KeyCode.D)
			? 1.0
			: input.isDown(KeyCode.A)
				? -1.0
				: 0.0;
		let jump = input.isDown(KeyCode.Space);

		const cameraWorldQuat = new Three.Quaternion();
		this.camera.worldMatrix.decompose(
			new Three.Vector3(),
			cameraWorldQuat,
			new Three.Vector3(),
		);

		const movementDirection = new Three.Vector3(
			right,
			0,
			-forward,
		).applyQuaternion(cameraWorldQuat);
		movementDirection.y = 0;
		movementDirection.normalize().multiplyScalar(2);

		let allowSliding = false;
		let enableCharacterInertia = true;

		const playerControlsHorizontalVelocity =
			this.controlMovementInAir || this.character!.character!.IsSupported();
		if (playerControlsHorizontalVelocity) {
			// True if the player intended to move
			allowSliding = !(movementDirection.length() < 1.0e-12);
			// Smooth the player input
			if (enableCharacterInertia) {
				this.desiredVelocity
					.multiplyScalar(0.75)
					.add(movementDirection.multiplyScalar(0.25 * this.characterSpeed));
			} else {
				this.desiredVelocity
					.copy(movementDirection)
					.multiplyScalar(this.characterSpeed);
			}
		} else {
			// While in air we allow sliding
			allowSliding = true;
		}

		_tmpVec3.Set(0, 0, 0);

		const character = this.character!.character;

		ASSERT(character, "Character is not initialized.");

		const characterUpRotation = Jolt.Quat.prototype.sEulerAngles(_tmpVec3);
		character.SetUp(characterUpRotation.RotateAxisY());
		character.SetRotation(characterUpRotation);
		const upRotation = wrapQuat(characterUpRotation);
		character.UpdateGroundVelocity();
		const characterUp = wrapVec3(character.GetUp());
		const linearVelocity = wrapVec3(character.GetLinearVelocity());
		const currentVerticalVelocity = characterUp
			.clone()
			.multiplyScalar(linearVelocity.dot(characterUp));
		const groundVelocity = wrapVec3(character.GetGroundVelocity());
		const gravity = wrapVec3(physics.world!.physicsSystem.GetGravity());

		let newVelocity;
		const movingTowardsGround =
			currentVerticalVelocity.y - groundVelocity.y < 0.1;
		if (
			character.GetGroundState() == Jolt.EGroundState_OnGround && // If on ground
			(enableCharacterInertia
				? movingTowardsGround // Inertia enabled: And not moving away from ground
				: !character.IsSlopeTooSteep(character.GetGroundNormal()))
		) {
			// Inertia disabled: And not on a slope that is too steep
			// Assume velocity of ground when on ground
			newVelocity = groundVelocity;

			// Jump
			if (jump && movingTowardsGround)
				newVelocity.add(characterUp.multiplyScalar(this.jumpSpeed));
		} else newVelocity = currentVerticalVelocity.clone();

		// Gravity
		newVelocity.add(gravity.multiplyScalar(delta).applyQuaternion(upRotation));

		if (playerControlsHorizontalVelocity) {
			// Player input
			newVelocity.add(this.desiredVelocity.clone().applyQuaternion(upRotation));
		} else {
			// Preserve horizontal velocity
			const currentHorizontalVelocity = linearVelocity.sub(
				currentVerticalVelocity,
			);
			newVelocity.add(currentHorizontalVelocity);
		}

		_tmpVec3.Set(newVelocity.x, newVelocity.y, newVelocity.z);
		character.SetLinearVelocity(_tmpVec3);
	}
}
