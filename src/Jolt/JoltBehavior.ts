// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';
import type Jolt from "jolt-physics/wasm-multithread";
import { Behavior } from "../Core/Behavior.ts";
import { JoltWorld } from "./JoltWorld.ts";
import { PhysicsLayer } from "./PhysicsLayer.ts";
import { PhysicsBodyType } from "./PhysicsBodyType.ts";

const s_JoltBodyId = Symbol.for("JoltBodyId");
const s_JoltBodyType = Symbol.for("JoltBodyType");
const s_JoltBodyLayer = Symbol.for("JoltBodyLayer");

type JoltWorker = never; // todo: implement worker maybe sometime :)

export class JoltPhysicsBehavior extends Behavior
{
	world: JoltWorld | JoltWorker | null = null;

	constructor(args: { worker?: boolean } = {})
	{
		super();
		if(args.worker) throw new Error("Worker support not implemented yet.");
	}

	async onLoad()
	{
		await JoltWorld.LoadJoltInstance();
		this.world = new JoltWorld();
		this.world.init();
	}

	override onUpdate(delta: number, elapsed: number)
	{
		if(!(this.world instanceof JoltWorld)) throw Error("Worker support not implemented yet.");
		this.world.tick(delta, elapsed);
	}

	override onDestroy()
	{
		if(!(this.world instanceof JoltWorld)) throw Error("Worker support not implemented yet.");
		this.world.destructor();
	}

	createBody(body: PhysicsBodyBehavior)
	{
		const Jolt = JoltWorld.GetJoltInstance();

		if(!(this.world instanceof JoltWorld)) throw Error("Worker support not implemented yet.");

		const threePos = new Three.Vector3;
		const threeRot = new Three.Quaternion;
		const threeScale = new Three.Vector3;
		body.parent.worldMatrix.decompose(threePos, threeRot, threeScale);

		const type = body.type === PhysicsBodyType.Dynamic ? Jolt.EMotionType_Dynamic : PhysicsBodyType.Kinematic ? Jolt.EMotionType_Kinematic : Jolt.EMotionType_Static;

	    const position = new Jolt.RVec3(threePos.x, threePos.y, threePos.z);
		const rotation = new Jolt.Quat(threeRot.x, threeRot.y, threeRot.z, threeRot.w);

		/*
		  todo:
		*/

		const creationSettings = new Jolt.BodyCreationSettings(new Jolt.EmptyShape, position, rotation, type, body.layer);
		creationSettings.mAllowDynamicOrKinematic = true;

		Jolt.destroy(position);
		Jolt.destroy(rotation);

		creationSettings.mRestitution = 0.5;
		const joltBody = this.world.bodyInterface.CreateBody(creationSettings);

		Jolt.destroy(creationSettings);

		const id = joltBody.GetID();
		this.world.bodyInterface.AddBody(id, Jolt.EActivation_Activate);
		body[s_JoltBodyId] = id;
	}

	removeBody(body: PhysicsBodyBehavior)
	{
		if(!(this.world instanceof JoltWorld)) throw Error("Worker support not implemented yet.");

		if(!body[s_JoltBodyId]) return;

		// does not destroy, just removes from world
		this.world.bodyInterface.RemoveBody(body[s_JoltBodyId]);
	}

	destroyBody(body: PhysicsBodyBehavior)
	{
		if(!(this.world instanceof JoltWorld)) throw Error("Worker support not implemented yet.");

		if(!body[s_JoltBodyId]) return;

		// must remove before destroy
		this.world.bodyInterface.RemoveBody(body[s_JoltBodyId]);
		this.world.bodyInterface.DestroyBody(body[s_JoltBodyId]);
	}

	bodyNeedsUpdate(body: PhysicsBodyBehavior)
	{
		// todo: implement body setting updates
	}
}

function IS_JOLT(obj: any): obj is JoltPhysicsBehavior { return obj instanceof JoltPhysicsBehavior; }

export class PhysicsBodyBehavior extends Behavior
{
	get layer() { return this[s_JoltBodyLayer]; }
	get type() { return this[s_JoltBodyType]; }

	constructor(args: { layer?: PhysicsLayer, type?: PhysicsBodyType, collider?: any } = {})
	{
		super();
		if(args.layer) this[s_JoltBodyLayer] = args.layer;
		if(args.type) this[s_JoltBodyType] = args.type;
	}

	override onEnable()
	{
		const joltBehavior = this.scene.physics
		if(!IS_JOLT(joltBehavior)) return;

		// create if not exists, and add to world
		joltBehavior.createBody(this);
	}

	override onDisable()
	{
		const joltBehavior = this.scene.physics
		if(!IS_JOLT(joltBehavior)) return;

		// remove from world
		joltBehavior.removeBody(this);
	}

	override onDestroy()
	{
		const joltBehavior = this.scene.physics
		if(!IS_JOLT(joltBehavior)) return;

		// destroy body
		joltBehavior.destroyBody(this);
	}

	[s_JoltBodyId]?: Jolt.BodyID;
	[s_JoltBodyType]: PhysicsBodyType = PhysicsBodyType.Dynamic;
	[s_JoltBodyLayer]: PhysicsLayer = PhysicsLayer.Dynamic;
}
