import { Behavior } from "../../src/Core/Behavior.ts";

export class OutOfBoundsBehavior extends Behavior
{
	onUpdate()
	{
		if(this.parent.position.y < -10) this.parent.destructor();
	}
}