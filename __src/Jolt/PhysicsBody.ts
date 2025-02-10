// @ts-types="npm:@types/three@^0.169"
import * as Three from "three";
import type Jolt from "jolt-physics/wasm-multithread";
import { Behavior } from "../Core/Behavior.ts";
import { ThreeObject } from "../Actors/ThreeObject.ts";
import { PhysicsWorldComponent } from "./PhysicsWorldComponent.ts";
import type { PhysicsLayer } from "./PhysicsLayer.ts";
import { isUndefined } from "../Shared/Asserts.ts";

const DEBUG_MATERIAL = new Three.LineBasicMaterial({
	color: 0x00ff00,
	linewidth: 10,
});

/**
 * See https://jrouwe.github.io/JoltPhysics/class_body_creation_settings.html
 */
interface PhysicsBodyBehaviorConstructorArguments {
	objectLayer: PhysicsLayer;
	motionType: Jolt.EMotionType;
	shape: Jolt.Shape;
	linearVelocity?: Three.Vector3;
	angularVelocity?: Three.Vector3;
	userData?: number;
	allowedDegreesOfFreedom?: Jolt.EAllowedDOFs;
	allowDynamicOrKinematic?: boolean;
	isSensor?: boolean;
	collideKinematicVsNonDynamuic?: boolean;
	useManifoldReduction?: boolean;
	applyGryoscopicForce?: boolean;
	motionQuality?: Jolt.EMotionQuality;
	enhancedInternalEdgeRemoval?: boolean;
	allowSleeping?: boolean;
	friction?: number;
	restitution?: number;
	linearDamping?: number;
	angularDamping?: number;
	maxLinearVelocity?: number;
	maxAngularVelocity?: number;
	gravityFactor?: number;
	numVelocityStepsOverride?: number;
	numPositionStepsOverride?: number;
	overrideMassProperties?: Jolt.EOverrideMassProperties;
	inertiaMultiplier?: number;
	massPropertiesOverride?: Jolt.MassProperties;
}

export class PhysicsBody extends Behavior {
	get joltBodyID(): Jolt.BodyID | undefined {
		return this.#joltBodyID;
	}

	constructor(args: PhysicsBodyBehaviorConstructorArguments) {
		super();
		this.static = true;
		this.#joltBodyCreationSettings = args;
	}

	override onCreate() {
		const joltBehavior = this.scene.physics;
		if (!IS_JOLT(joltBehavior)) return;
		const Jolt = joltBehavior.getJoltInstance()!;

		// create
		const bodySettings = new Jolt.BodyCreationSettings();
		bodySettings.mObjectLayer = this.#joltBodyCreationSettings.objectLayer;
		bodySettings.mMotionType = this.#joltBodyCreationSettings.motionType;
		bodySettings.SetShape(this.#joltBodyCreationSettings.shape);
		if (this.#joltBodyCreationSettings.linearVelocity)
			bodySettings.mLinearVelocity = new Jolt.Vec3(
				this.#joltBodyCreationSettings.linearVelocity.x,
				this.#joltBodyCreationSettings.linearVelocity.y,
				this.#joltBodyCreationSettings.linearVelocity.z,
			);
		if (this.#joltBodyCreationSettings.angularVelocity)
			bodySettings.mAngularVelocity = new Jolt.Vec3(
				this.#joltBodyCreationSettings.angularVelocity.x,
				this.#joltBodyCreationSettings.angularVelocity.y,
				this.#joltBodyCreationSettings.angularVelocity.z,
			);
		if (!isUndefined(this.#joltBodyCreationSettings.userData))
			bodySettings.mUserData = this.#joltBodyCreationSettings.userData;
		if (!isUndefined(this.#joltBodyCreationSettings.allowedDegreesOfFreedom))
			bodySettings.mAllowedDOFs =
				this.#joltBodyCreationSettings.allowedDegreesOfFreedom;
		if (!isUndefined(this.#joltBodyCreationSettings.allowDynamicOrKinematic))
			bodySettings.mAllowDynamicOrKinematic =
				this.#joltBodyCreationSettings.allowDynamicOrKinematic;
		if (!isUndefined(this.#joltBodyCreationSettings.isSensor))
			bodySettings.mIsSensor = this.#joltBodyCreationSettings.isSensor;
		if (
			!isUndefined(this.#joltBodyCreationSettings.collideKinematicVsNonDynamuic)
		)
			bodySettings.set_mCollideKinematicVsNonDynamic(
				this.#joltBodyCreationSettings.collideKinematicVsNonDynamuic,
			);
		if (!isUndefined(this.#joltBodyCreationSettings.useManifoldReduction))
			bodySettings.set_mUseManifoldReduction(
				this.#joltBodyCreationSettings.useManifoldReduction,
			);
		if (!isUndefined(this.#joltBodyCreationSettings.applyGryoscopicForce))
			bodySettings.set_mApplyGyroscopicForce(
				this.#joltBodyCreationSettings.applyGryoscopicForce,
			);
		if (!isUndefined(this.#joltBodyCreationSettings.motionQuality))
			bodySettings.mMotionQuality =
				this.#joltBodyCreationSettings.motionQuality;
		if (
			!isUndefined(this.#joltBodyCreationSettings.enhancedInternalEdgeRemoval)
		)
			bodySettings.mEnhancedInternalEdgeRemoval =
				this.#joltBodyCreationSettings.enhancedInternalEdgeRemoval;
		if (!isUndefined(this.#joltBodyCreationSettings.allowSleeping))
			bodySettings.mAllowSleeping =
				this.#joltBodyCreationSettings.allowSleeping;
		if (!isUndefined(this.#joltBodyCreationSettings.friction))
			bodySettings.mFriction = this.#joltBodyCreationSettings.friction;
		if (!isUndefined(this.#joltBodyCreationSettings.restitution))
			bodySettings.mRestitution = this.#joltBodyCreationSettings.restitution;
		if (!isUndefined(this.#joltBodyCreationSettings.linearDamping))
			bodySettings.mLinearDamping =
				this.#joltBodyCreationSettings.linearDamping;
		if (!isUndefined(this.#joltBodyCreationSettings.angularDamping))
			bodySettings.mAngularDamping =
				this.#joltBodyCreationSettings.angularDamping;
		if (!isUndefined(this.#joltBodyCreationSettings.maxLinearVelocity))
			bodySettings.mMaxLinearVelocity =
				this.#joltBodyCreationSettings.maxLinearVelocity;
		if (!isUndefined(this.#joltBodyCreationSettings.maxAngularVelocity))
			bodySettings.mMaxAngularVelocity =
				this.#joltBodyCreationSettings.maxAngularVelocity;
		if (!isUndefined(this.#joltBodyCreationSettings.gravityFactor))
			bodySettings.mGravityFactor =
				this.#joltBodyCreationSettings.gravityFactor;
		if (!isUndefined(this.#joltBodyCreationSettings.numVelocityStepsOverride))
			bodySettings.mNumVelocityStepsOverride =
				this.#joltBodyCreationSettings.numVelocityStepsOverride;
		if (!isUndefined(this.#joltBodyCreationSettings.numPositionStepsOverride))
			bodySettings.mNumPositionStepsOverride =
				this.#joltBodyCreationSettings.numPositionStepsOverride;
		if (!isUndefined(this.#joltBodyCreationSettings.overrideMassProperties))
			bodySettings.mOverrideMassProperties =
				this.#joltBodyCreationSettings.overrideMassProperties;
		if (!isUndefined(this.#joltBodyCreationSettings.inertiaMultiplier))
			bodySettings.mInertiaMultiplier =
				this.#joltBodyCreationSettings.inertiaMultiplier;
		if (!isUndefined(this.#joltBodyCreationSettings.massPropertiesOverride))
			bodySettings.mMassPropertiesOverride =
				this.#joltBodyCreationSettings.massPropertiesOverride;

		this.#joltBodyID = joltBehavior.createBody(bodySettings);
	}

	override onEnable() {
		const joltBehavior = this.scene.physics;
		if (!IS_JOLT(joltBehavior)) return;

		joltBehavior.addBodyToWorld(this.#joltBodyID!);

		if (joltBehavior.debug) {
			this.updateDebugMesh();
		}
	}

	override onDisable() {
		const joltBehavior = this.scene.physics;
		if (!IS_JOLT(joltBehavior)) return;

		// remove from world
		joltBehavior.removeBodyFromWorld(this.#joltBodyID!);

		this.removeDebugMesh();
	}

	override destructor() {
		const joltBehavior = this.scene.physics;
		if (!IS_JOLT(joltBehavior)) return;

		// destroy body
		joltBehavior.destroyBody(this.#joltBodyID!);
	}

	updateDebugMesh() {
		const joltBehavior = this.scene.physics;
		if (!IS_JOLT(joltBehavior)) return;

		const Jolt = joltBehavior.getJoltInstance()!;

		const shape = joltBehavior.world!.bodyInterface.GetShape(this.#joltBodyID!);
		const triContext = new Jolt.ShapeGetTriangles(
			shape,
			Jolt.AABox.prototype.sBiggest(),
			shape.GetCenterOfMass(),
			Jolt.Quat.prototype.sIdentity(),
			new Jolt.Vec3(1, 1, 1),
		);
		const vertices = new Float32Array(
			Jolt.HEAPF32.buffer,
			triContext.GetVerticesData(),
			triContext.GetVerticesSize() / Float32Array.BYTES_PER_ELEMENT,
		);
		const buffer = new Three.BufferAttribute(vertices, 3).clone();
		Jolt.destroy(triContext);
		const geometry = new Three.BufferGeometry();
		geometry.setAttribute("position", buffer);
		geometry.computeVertexNormals();

		this.removeDebugMesh();
		this.#debugActor = new ThreeObject(
			new Three.LineSegments(
				new Three.WireframeGeometry(geometry),
				DEBUG_MATERIAL,
			),
		);
		this.#debugActor.scale.setScalar(1.0001);
		this.parent.addComponent(this.#debugActor);
	}

	removeDebugMesh() {
		if (this.#debugActor) {
			this.#debugActor.destructor();
			this.#debugActor = undefined;
		}
	}

	#joltBodyID?: Jolt.BodyID;
	#debugActor?: ThreeObject;
	#joltBodyCreationSettings: PhysicsBodyBehaviorConstructorArguments;
}

function IS_JOLT(obj: any): obj is PhysicsWorldComponent {
	return obj instanceof PhysicsWorldComponent;
}
