// @ts-types="npm:@types/three@^0.169"
import * as Three from "three";
import type Jolt from "jolt-physics/wasm-multithread";
import { Behavior } from "../Core/Behavior.ts";
import { JoltWorld } from "./JoltWorld.ts";
import { PhysicsLayer } from "./PhysicsLayer.ts";
import type { ComponentSet } from "../Containers/ComponentSet.ts";
import { ThreeObject } from "../Actors/ThreeObject.ts";

const DEBUG_MATERIAL = new Three.LineBasicMaterial({ color: 0x00ff00, linewidth: 10, });

export class JoltPhysicsWorldComponent extends Behavior
{
	world?: JoltWorld;

	bodyBehaviors?: ComponentSet<PhysicsBodyBehavior>;

	get debug(): boolean { return this.#debug; }
	set debug(value: boolean) { this.#debug = value; }

	async onLoad()
	{
		await JoltWorld.LoadJoltInstance();
		this.world = new JoltWorld;
		this.world.init();
		console.log("Jolt physics behavior initialized.");
	}

	override onCreate()
	{
		// get a ref to this container once instead of each frame
		this.bodyBehaviors = this.scene.getComponentsByType(PhysicsBodyBehavior);
	}

	override onUpdate(delta: number, elapsed: number)
	{
		const Jolt = JoltWorld.GetJoltInstance();
		const before_tick_start = performance.now();
		const pos = new Three.Vector3();
		const rot = new Three.Quaternion();
		const scale = new Three.Vector3();

		const jPos = new Jolt.RVec3();
		const jRot = new Jolt.Quat();

		for (const body of this.bodyBehaviors ?? [])
		{
			if(!body.joltBodyID || !body.parent.transformDirty) continue;

			body.parent.worldMatrix.decompose(pos, rot, scale);
			jPos.Set(pos.x, pos.y, pos.z);
			jRot.Set(rot.x, rot.y, rot.z, rot.w);
			this.world!.bodyInterface.SetPositionAndRotation(body.joltBodyID, jPos, jRot, Jolt.EActivation_DontActivate);
		}

		Jolt.destroy(jPos);
		Jolt.destroy(jRot);
		const before_tick_end = performance.now();
		this.world!.tick(delta, elapsed);
		const after_tick_start = performance.now();
		for (const body of this.bodyBehaviors ?? [])
		{
			if(!body.joltBodyID || !this.world!.bodyInterface.IsActive(body.joltBodyID)) continue;

			const worldTransform = this.world!.bodyInterface.GetWorldTransform(body.joltBodyID);
			const position = worldTransform.GetTranslation();
			const rotation = worldTransform.GetQuaternion();
			body.parent.position.set(position.GetX(), position.GetY(), position.GetZ());
			body.parent.rotation.set(rotation.GetX(), rotation.GetY(), rotation.GetZ(), rotation.GetW());
		}
		const after_tick_end = performance.now();

		console.log(
			"Before tick: ", before_tick_end - before_tick_start,
			"Tick: ", after_tick_start - before_tick_end,
			"After tick: ", after_tick_end - after_tick_start
		)
	}

	override onDestroy()
	{
		this.world?.destructor();
	}

	public createBody(body: Jolt.BodyCreationSettings): Jolt.BodyID
	{
		const joltBody = this.world!.bodyInterface.CreateBody(body);
		return joltBody.GetID();
	}

	// todo: implement batch addition
	public addBodyToWorld(bodyID: Jolt.BodyID)
	{
		if(!(this.world instanceof JoltWorld)) return;
		const Jolt = JoltWorld.GetJoltInstance();
		this.world.bodyInterface.AddBody(bodyID, Jolt.EActivation_Activate);
	}

	// todo: implement batch removal
	public removeBodyFromWorld(bodyID: Jolt.BodyID)
	{
		if(!(this.world instanceof JoltWorld)) return;
		this.world.bodyInterface.RemoveBody(bodyID);
	}

	public destroyBody(bodyID: Jolt.BodyID)
	{
		if (!(this.world instanceof JoltWorld)) return;
		// must remove before destroy
		this.world.bodyInterface.RemoveBody(bodyID);
		this.world.bodyInterface.DestroyBody(bodyID);
	}

	public getJoltInstance(): typeof Jolt | undefined
	{
		return JoltWorld.GetJoltInstance();
	}

	#debug = false;
}

interface PhysicsBodyBehaviorConstructorArguments
{
	bodyCreationSettings: Jolt.BodyCreationSettings;
	layer?: PhysicsLayer;
}

export class PhysicsBodyBehavior extends Behavior {

	get joltBodyID(): Jolt.BodyID | undefined { return this.#joltBodyID; }

	constructor(args: PhysicsBodyBehaviorConstructorArguments)
	{
		super();
		this.static = true;
		this.#joltBodyCreationSettings = args.bodyCreationSettings;
		// if (args.layer) this.#joltBodyCreationSettings.set_mObjectLayer(args.layer);
		// else this.#joltBodyCreationSettings.set_mObjectLayer(PhysicsLayer.Static);
	}

	override onCreate()
	{
		const joltBehavior = this.scene.physics;
		if (!IS_JOLT(joltBehavior)) return;

		this.#joltBodyID = joltBehavior.createBody(this.#joltBodyCreationSettings);
	}

	override onEnable()
	{
		const joltBehavior = this.scene.physics;
		if (!IS_JOLT(joltBehavior)) return;

		joltBehavior.addBodyToWorld(this.#joltBodyID!);

		if(joltBehavior.debug)
		{
			this.updateDebugMesh();
		}
	}

	override onDisable()
	{
		const joltBehavior = this.scene.physics;
		if (!IS_JOLT(joltBehavior)) return;

		// remove from world
		joltBehavior.removeBodyFromWorld(this.#joltBodyID!);

		this.removeDebugMesh();
	}

	override destructor()
	{
		const joltBehavior = this.scene.physics;
		if (!IS_JOLT(joltBehavior)) return;

		// destroy body
		joltBehavior.destroyBody(this.#joltBodyID!);
	}

	updateDebugMesh()
	{
		const joltBehavior = this.scene.physics;
		if (!IS_JOLT(joltBehavior)) return;

		const Jolt = joltBehavior.getJoltInstance()!;

		const shape = joltBehavior.world!.bodyInterface.GetShape(this.#joltBodyID!);
		const triContext = new Jolt.ShapeGetTriangles(shape, Jolt.AABox.prototype.sBiggest(), shape.GetCenterOfMass(), Jolt.Quat.prototype.sIdentity(), new Jolt.Vec3(1, 1, 1));
		const vertices = new Float32Array(Jolt.HEAPF32.buffer, triContext.GetVerticesData(), triContext.GetVerticesSize() / Float32Array.BYTES_PER_ELEMENT);
		const buffer = new Three.BufferAttribute(vertices, 3).clone();
		Jolt.destroy(triContext);
		const geometry = new Three.BufferGeometry();
		geometry.setAttribute('position', buffer);
		geometry.computeVertexNormals();

		this.removeDebugMesh();
		this.#debugActor = new ThreeObject(
			new Three.LineSegments(new Three.WireframeGeometry(geometry), DEBUG_MATERIAL)
		);
		this.#debugActor.scale.setScalar(1.0001);
		this.parent.addComponent(this.#debugActor);
	}

	removeDebugMesh()
	{
		if(this.#debugActor)
		{
			this.#debugActor.destructor();
			this.#debugActor = undefined;
		}
	}

	#joltBodyID?: Jolt.BodyID;
	#debugActor?: ThreeObject
	#joltBodyCreationSettings: Jolt.BodyCreationSettings;
}

function IS_JOLT(obj: any): obj is JoltPhysicsWorldComponent
{
	return obj instanceof JoltPhysicsWorldComponent;
}
