import { IDestroyable } from "../Core/Lifecycle.ts";
import type Jolt from "jolt-physics/wasm-multithread";
import JoltInitMultithreaded from "jolt-physics/wasm-multithread";
import JoltInit from "jolt-physics/wasm"
import { PHYSICS_LAYER_COUNT, PhysicsLayer } from "./PhysicsLayer.ts";
import { isSecureContext } from "../Shared/Platform.ts";
import {noop} from "../Shared/Utilities.ts";

export class PhysicsWorld implements IDestroyable
{
	static JoltInstance: typeof Jolt | null = null;

	static IsMultiThreaded()
	{
		return isSecureContext();
	}

	static GetJoltInstance()
	{
		if(!PhysicsWorld.JoltInstance) throw new Error("Jolt physics engine not initialized. Call `await JoltBehavior.Init()` before using Jolt!");
		return PhysicsWorld.JoltInstance;
	}

	static async LoadJoltInstance()
	{
		console.log("Loading Jolt engine in", isSecureContext() ? "multi-threaded" : "single-threaded", "mode.");
		PhysicsWorld.JoltInstance = isSecureContext() ? await JoltInitMultithreaded() : await JoltInit();
	}

	get initialized()
	{
		return this.#joltInitialized;
	}

	get joltInterface()
	{
		if(!this.#joltInterface) throw new Error("Jolt physics engine not initialized. Call `await JoltBehavior.Init()` before using Jolt!");
		return this.#joltInterface;
	}

	get bodyInterface()
	{
		if(!this.#bodyInterface) throw new Error("Jolt physics engine not initialized. Call `await JoltBehavior.Init()` before using Jolt!");
		return this.#bodyInterface;
	}

	get physicsSystem()
	{
		if(!this.#physicsSystem) throw new Error("Jolt physics engine not initialized. Call `await JoltBehavior.Init()` before using Jolt!");
		return this.#physicsSystem;
	}

	init()
	{
		const Jolt = PhysicsWorld.GetJoltInstance();

		if(this.#joltInitialized)
		{
			console.warn("Jolt physics engine already initialized. Skipping initialization.");
			return;
		}

		const settings = new Jolt.JoltSettings();
		settings.mMaxWorkerThreads = 6;

		{
			const objectFilter = new Jolt.ObjectLayerPairFilterTable(PHYSICS_LAYER_COUNT);
			objectFilter.EnableCollision(PhysicsLayer.Static, PhysicsLayer.Dynamic);
			objectFilter.EnableCollision(PhysicsLayer.Dynamic, PhysicsLayer.Dynamic);

			const BP_LAYER_NON_MOVING = new Jolt.BroadPhaseLayer(0);
			const BP_LAYER_MOVING = new Jolt.BroadPhaseLayer(1);
			const NUM_BROAD_PHASE_LAYERS = 2;

			const bpInterface = new Jolt.BroadPhaseLayerInterfaceTable(PHYSICS_LAYER_COUNT, NUM_BROAD_PHASE_LAYERS);
			bpInterface.MapObjectToBroadPhaseLayer(PhysicsLayer.Static, BP_LAYER_NON_MOVING);
			bpInterface.MapObjectToBroadPhaseLayer(PhysicsLayer.Dynamic, BP_LAYER_MOVING);

			settings.mObjectLayerPairFilter = objectFilter;
			settings.mBroadPhaseLayerInterface = bpInterface;
			settings.mObjectVsBroadPhaseLayerFilter = new Jolt.ObjectVsBroadPhaseLayerFilterTable(settings.mBroadPhaseLayerInterface, NUM_BROAD_PHASE_LAYERS, settings.mObjectLayerPairFilter, PHYSICS_LAYER_COUNT);

			Jolt.destroy(BP_LAYER_MOVING);
			Jolt.destroy(BP_LAYER_NON_MOVING);
		}

		this.#joltInterface = new Jolt.JoltInterface(settings);
		Jolt.destroy(settings);
		this.#physicsSystem = this.#joltInterface.GetPhysicsSystem();
		this.#bodyInterface = this.#physicsSystem.GetBodyInterface();
		this.#joltInitialized = true;

		const contactListner = new Jolt.ContactListenerJS;

		contactListner.OnContactAdded = (bodyA, bodyB) => {
			console.log("Contact added between", bodyA, bodyB);
		}

		contactListner.OnContactPersisted = noop;
		contactListner.OnContactRemoved = noop;
		contactListner.OnContactValidate = () => 1;

		// this.#physicsSystem.SetContactListener(contactListner);

		console.log("Jolt physics engine initialized.");
	}

	tick(delta: number, elapsed: number)
	{
		// submit stringified contact listner functions
		this.joltInterface.Step(delta, delta > 1.0 / 55.0 ? 2 : 1);
		// parse and run contact listener events
	}

	destructor()
	{
		const Jolt = PhysicsWorld.JoltInstance;
		if(!Jolt) return;
		Jolt.destroy(this.#joltInterface);
		Jolt.destroy(this.#bodyInterface);
		Jolt.destroy(this.#physicsSystem);
		this.#joltInterface = undefined;
		this.#bodyInterface = undefined;
		this.#physicsSystem = undefined;
		this.#joltInitialized = false;
	}

	#joltInterface?: Jolt.JoltInterface;
	#bodyInterface?: Jolt.BodyInterface;
	#physicsSystem?: Jolt.PhysicsSystem;
	#joltInitialized = false;
}