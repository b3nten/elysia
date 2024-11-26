// @ts-types="npm:@types/three@^0.169"
import * as Three from "three";
import { Behavior } from "../Core/Behavior.ts";
import { PhysicsWorld } from "./PhysicsWorld.ts";
import type Jolt from "jolt-physics/wasm-multithread";
import type { ComponentSet } from "../Containers/ComponentSet.ts";
import { PhysicsBody } from "./PhysicsBody.ts";

export class PhysicsWorldComponent extends Behavior {
  world?: PhysicsWorld;

  bodyBehaviors?: ComponentSet<PhysicsBody>;

  get debug(): boolean {
    return this.#debug;
  }
  set debug(value: boolean) {
    this.#debug = value;
  }

  async onLoad() {
    await PhysicsWorld.LoadJoltInstance();
    this.world = new PhysicsWorld();
    this.world.init();
    console.log("Jolt physics behavior initialized.");
  }

  override onCreate() {
    // get a ref to this container once instead of each frame
    this.bodyBehaviors = this.scene.getComponentsByType(PhysicsBody);
  }

  override onUpdate(delta: number, elapsed: number)
  {
    const Jolt = PhysicsWorld.GetJoltInstance();

    const pos = new Three.Vector3();
    const rot = new Three.Quaternion();
    const scale = new Three.Vector3();

    const jPos = new Jolt.RVec3();
    const jRot = new Jolt.Quat();

    for (const body of this.bodyBehaviors ?? []) {
      if (!body.joltBodyID || !body.parent.transformDirty) continue;

      body.parent.worldMatrix.decompose(pos, rot, scale);
      jPos.Set(pos.x, pos.y, pos.z);
      jRot.Set(rot.x, rot.y, rot.z, rot.w);
      this.world!.bodyInterface.SetPositionAndRotation(
        body.joltBodyID,
        jPos,
        jRot,
        Jolt.EActivation_DontActivate,
      );
    }

    Jolt.destroy(jPos);
    Jolt.destroy(jRot);

    this.world!.tick(delta, elapsed);

    for (const body of this.bodyBehaviors ?? []) {
      if (
        !body.joltBodyID || !this.world!.bodyInterface.IsActive(body.joltBodyID)
      ) continue;

      const worldTransform = this.world!.bodyInterface.GetWorldTransform(
        body.joltBodyID,
      );
      const position = worldTransform.GetTranslation();
      const rotation = worldTransform.GetQuaternion();
      body.parent.position.set(
        position.GetX(),
        position.GetY(),
        position.GetZ(),
      );
      body.parent.rotation.set(
        rotation.GetX(),
        rotation.GetY(),
        rotation.GetZ(),
        rotation.GetW(),
      );
    }
  }

  override onDestroy(): void
  {
    this.world?.destructor();
  }

  public createBody(body: Jolt.BodyCreationSettings): Jolt.BodyID
  {
    const joltBody = this.world!.bodyInterface.CreateBody(body);
    return joltBody.GetID();
  }

  // todo: implement batch addition
  public addBodyToWorld(bodyID: Jolt.BodyID) {
    if (!(this.world instanceof PhysicsWorld)) return;
    const Jolt = PhysicsWorld.GetJoltInstance();
    this.world.bodyInterface.AddBody(bodyID, Jolt.EActivation_Activate);
  }

  // todo: implement batch removal
  public removeBodyFromWorld(bodyID: Jolt.BodyID) {
    if (!(this.world instanceof PhysicsWorld)) return;
    this.world.bodyInterface.RemoveBody(bodyID);
  }

  public destroyBody(bodyID: Jolt.BodyID) {
    if (!(this.world instanceof PhysicsWorld)) return;
    // must remove before destroy
    this.world.bodyInterface.RemoveBody(bodyID);
    this.world.bodyInterface.DestroyBody(bodyID);
  }

  public getJoltInstance(): typeof Jolt | undefined {
    return PhysicsWorld.GetJoltInstance();
  }

  #debug = false;
}
