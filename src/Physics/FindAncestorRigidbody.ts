import { Actor } from "../Scene/Actor.ts";
import { RigidBody } from "./RigidBody.ts";

export function findAncestorRigidbody(actor?: Actor): RigidBody | undefined {
	if (!actor) return undefined;
	if (actor.type === "Scene") return undefined;

	let rb = actor.getComponentsByType(RigidBody);
	if (rb.first) return rb.first
	if (!actor.parent || actor.parent.type === "Scene") return undefined;
	rb = actor.parent.getComponentsByType(RigidBody);
	if (rb.first) return rb.first
	return findAncestorRigidbody(actor.parent);
}