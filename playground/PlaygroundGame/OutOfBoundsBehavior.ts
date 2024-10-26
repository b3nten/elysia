import { Behavior } from "../../src/Scene/Behavior.ts";

export class OutOfBoundsBehavior extends Behavior
{
	onUpdate()
	{
		if(this.parent.position.y < -10) this.parent.destructor();
	}
}