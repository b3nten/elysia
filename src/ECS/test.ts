import { Component, Transform } from "./Component.ts";
import { System } from "./System.ts";
import { Entity } from "./Entity.ts";
import { World } from "./World.ts";
import { Transform, MeshRenderer } from "./Component.ts";

const w = new World;

class TestSystem extends System
{
	protected override onUpdate(context: World, delta: number, elapsed: number)
	{
		for(const thing of context.iterateByComponent(Transform))
		{
			console.log(thing);
			if(thing[1].posX)
			{
				// w.addComponent(w.addEntity(), new Transform());
				// w.removeComponent(0, Transform)
			}
		}
	}

	readonly name: string = "TestSystem";
}

w.addSystem(TestSystem);

let e = w.addEntity()
const t = new Transform
t.posX = 1;
w.addComponent(e, t);

e = w.addEntity()
w.addComponent(e, new Transform);

w.start();
w.update(0,0);
