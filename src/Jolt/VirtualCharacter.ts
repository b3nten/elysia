import { Behavior } from "../Core/Behavior.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from "three";
import type Jolt from "jolt-physics/wasm-multithread";
import { PhysicsWorldComponent } from "./PhysicsWorldComponent.ts";
import { PhysicsLayer } from "./PhysicsLayer.ts";
import { ASSERT } from "../Shared/Asserts.ts";

export interface VirtualCharacterConstructorArguments {
	stickToFloor?: boolean;
	walkStairs?: boolean;

	maxSlopeAngle?: number;
	inhancedInternalEdgeRemoval?: boolean;
	shape: Jolt.Shape;

	mass?: number;
	maxStrength?: number;
	shapeOffset?: Three.Vector3;
	backFaceMode?: Jolt.EBackFaceMode;
	predictiveContactDistance?: number;
	maxCollisionIterations?: number;
	maxConstraintIterations?: number;
	minTimeRemaining?: number;
	collisionTolerance?: number;
	characterPadding?: number;
	maxNumHits?: number;
	hitReductionCosMaxAngle?: number;
	penetrationRecoverySpeed?: number;
	innerBodyShape?: Jolt.Shape;
	innerBodyLayer?: PhysicsLayer;
}

export class VirtualCharacter extends Behavior {
	get character(): Jolt.CharacterVirtual | undefined {
		return this.#character;
	}

	get updateSettings(): Jolt.ExtendedUpdateSettings | undefined {
		return this.#updateSettings;
	}

	constructor(args: VirtualCharacterConstructorArguments) {
		super();
		this.#creationSettings = args;
	}

	override onCreate() {
		const joltBehavior = this.scene.physics;
		if (!IS_JOLT(joltBehavior)) return;
		const Jolt = joltBehavior.getJoltInstance()!;

		const settings = new Jolt.CharacterVirtualSettings();
		// set settings
		settings.mShape = this.#creationSettings.shape!;
		if (this.#creationSettings.maxSlopeAngle)
			settings.mMaxSlopeAngle = this.#creationSettings.maxSlopeAngle;
		if (this.#creationSettings.inhancedInternalEdgeRemoval)
			settings.mEnhancedInternalEdgeRemoval =
				this.#creationSettings.inhancedInternalEdgeRemoval;
		if (this.#creationSettings.mass)
			settings.mMass = this.#creationSettings.mass;
		if (this.#creationSettings.maxStrength)
			settings.mMaxStrength = this.#creationSettings.maxStrength;
		if (this.#creationSettings.shapeOffset)
			settings.mShapeOffset = new Jolt.Vec3(
				this.#creationSettings.shapeOffset.x,
				this.#creationSettings.shapeOffset.y,
				this.#creationSettings.shapeOffset.z,
			);
		if (this.#creationSettings.backFaceMode)
			settings.mBackFaceMode = this.#creationSettings.backFaceMode;
		if (this.#creationSettings.predictiveContactDistance)
			settings.mPredictiveContactDistance =
				this.#creationSettings.predictiveContactDistance;
		if (this.#creationSettings.maxCollisionIterations)
			settings.mMaxCollisionIterations =
				this.#creationSettings.maxCollisionIterations;
		if (this.#creationSettings.maxConstraintIterations)
			settings.mMaxConstraintIterations =
				this.#creationSettings.maxConstraintIterations;
		if (this.#creationSettings.minTimeRemaining)
			settings.mMinTimeRemaining = this.#creationSettings.minTimeRemaining;
		if (this.#creationSettings.collisionTolerance)
			settings.mCollisionTolerance = this.#creationSettings.collisionTolerance;
		if (this.#creationSettings.characterPadding)
			settings.mCharacterPadding = this.#creationSettings.characterPadding;
		if (this.#creationSettings.maxNumHits)
			settings.mMaxNumHits = this.#creationSettings.maxNumHits;
		if (this.#creationSettings.hitReductionCosMaxAngle)
			settings.mHitReductionCosMaxAngle =
				this.#creationSettings.hitReductionCosMaxAngle;
		if (this.#creationSettings.penetrationRecoverySpeed)
			settings.mPenetrationRecoverySpeed =
				this.#creationSettings.penetrationRecoverySpeed;
		if (this.#creationSettings.innerBodyShape)
			settings.mInnerBodyShape = this.#creationSettings.innerBodyShape;
		if (this.#creationSettings.innerBodyLayer)
			settings.mInnerBodyLayer = this.#creationSettings.innerBodyLayer;

		this.#updateSettings = new Jolt.ExtendedUpdateSettings();
		this.#character = new Jolt.CharacterVirtual(
			settings,
			Jolt.RVec3.prototype.sZero(),
			Jolt.Quat.prototype.sIdentity(),
			(this.scene.physics as unknown as PhysicsWorldComponent)!.world!
				.physicsSystem,
		);

		const objectVsBroadPhaseLayerFilter =
			joltBehavior.world!.joltInterface.GetObjectVsBroadPhaseLayerFilter();
		const objectLayerPairFilter =
			joltBehavior.world!.joltInterface.GetObjectLayerPairFilter();

		this.#movingBPFilter = new Jolt.DefaultBroadPhaseLayerFilter(
			objectVsBroadPhaseLayerFilter,
			PhysicsLayer.Dynamic,
		);
		this.#movingLayerFilter = new Jolt.DefaultObjectLayerFilter(
			objectLayerPairFilter,
			PhysicsLayer.Dynamic,
		);
		this.#bodyFilter = new Jolt.BodyFilter();
		this.#shapeFilter = new Jolt.ShapeFilter();

		ASSERT(
			this.#character &&
				this.#updateSettings &&
				this.#movingBPFilter &&
				this.#movingLayerFilter &&
				this.#bodyFilter &&
				this.#shapeFilter,
		);
	}

	override onBeforePhysicsUpdate(delta: number, elapsed: number): void {
		const joltBehavior = this.scene.physics;
		if (!IS_JOLT(joltBehavior)) return;
		const Jolt = joltBehavior.getJoltInstance()!;

		const physicsSystem = (this.scene
			.physics as unknown as PhysicsWorldComponent)!.world!.physicsSystem;

		const wrapVec3 = (v: Jolt.Vec3 | Jolt.RVec3) =>
			new Three.Vector3(v.GetX(), v.GetY(), v.GetZ());

		const characterUp = wrapVec3(this.#character!.GetUp());

		if (!this.#creationSettings.stickToFloor) {
			this.#updateSettings!.mStickToFloorStepDown = Jolt.Vec3.prototype.sZero();
		} else {
			const vec = characterUp
				.clone()
				.multiplyScalar(-this.#updateSettings!.mStickToFloorStepDown.Length());
			this.#updateSettings!.mStickToFloorStepDown.Set(vec.x, vec.y, vec.z);
		}

		if (!this.#creationSettings.walkStairs) {
			this.#updateSettings!.mWalkStairsStepUp = Jolt.Vec3.prototype.sZero();
		} else {
			const vec = characterUp
				.clone()
				.multiplyScalar(this.#updateSettings!.mWalkStairsStepUp.Length());
			this.#updateSettings!.mWalkStairsStepUp.Set(vec.x, vec.y, vec.z);
		}
		characterUp.multiplyScalar(-physicsSystem.GetGravity().Length());

		const alloc = joltBehavior.world!.joltInterface.GetTempAllocator();

		this.#character!.ExtendedUpdate(
			delta,
			this.#character!.GetUp(),
			this.#updateSettings!,
			this.#movingBPFilter!,
			this.#movingLayerFilter!,
			this.#bodyFilter!,
			this.#shapeFilter!,
			alloc,
		);

		this.parent.position.copy(wrapVec3(this.#character!.GetPosition()));
	}

	override destructor() {
		const joltBehavior = this.scene.physics;
		if (!IS_JOLT(joltBehavior)) return;
		const Jolt = joltBehavior.getJoltInstance()!;

		// Jolt.destroy(this.#character);
		// this.#character = undefined;
	}

	#character?: Jolt.CharacterVirtual;
	#creationSettings: VirtualCharacterConstructorArguments;
	#updateSettings?: Jolt.ExtendedUpdateSettings;
	#movingBPFilter?: Jolt.DefaultBroadPhaseLayerFilter;
	#movingLayerFilter?: Jolt.DefaultObjectLayerFilter;
	#bodyFilter?: Jolt.BodyFilter;
	#shapeFilter?: Jolt.ShapeFilter;
}

function IS_JOLT(obj: any): obj is PhysicsWorldComponent {
	return obj instanceof PhysicsWorldComponent;
}
