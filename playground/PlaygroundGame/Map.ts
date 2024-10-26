import { CubeActor, ModelActor } from "../../src/Actors/mod.ts"
import { BoxCollider, MeshCollider, RigidBody, RigidbodyType } from "../../src/Physics/mod.ts"
import { Colors } from "../../src/Core/Colors.ts"
import { playgroundAssets } from "./Assets.ts";
// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three'

export class Map extends ModelActor {
	constructor() {
		super(playgroundAssets.unwrap("Map").gltf)
	}

	onCreate()
	{
		this.position.y =-5

		const mesh = playgroundAssets.unwrap("Map").gltf.scene;

		// create and position colliders for each mesh in the gltf
		for(const child of mesh.children)
		{
			if(!(child instanceof Three.Mesh)) continue;
			const actor = new MeshCollider(child.geometry.getAttribute("position").array as Float32Array);
			actor.position.copy(child.position);
			actor.rotation.copy(child.rotation);
			actor.scale.copy(child.scale);
			this.addComponent(actor);
		}

		for(let x = 0; x <= 5; x++)
			for(let y = 0; y <= 5; y++)
				for(let z = 0; z <= 5; z++) {
					const actor = new CubeActor;
					actor.material.color = new Three.Color(Colors.Pink);
					actor.addComponent(new BoxCollider);
					actor.addComponent(new RigidBody(RigidbodyType.Dynamic))
					actor.position.set(x/1.95, y/1.95 + 2, z/1.95);
					actor.scale.setScalar(.5);
					this.addComponent(actor);
				}

	}
}