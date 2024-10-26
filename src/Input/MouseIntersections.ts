import { ActiveCameraTag } from "../Core/Tags.ts";
// @ts-types="npm:@types/three@^0.169"
import * as Three from 'three';
import { Scene } from "../Scene/Scene.ts";

/**
 * @internal
 * Collect mouse intersections with actors.
 */
export class MouseIntersections
{

	/**
	 * A set of Actors that the mouse is currently intersecting with
	 */
	public readonly intersections: Set<any> = new Set;

	/**
	 * Cast a ray from the mouse position and get intersections with actors
	 * @param scene
	 */
	public cast(camera: Three.Camera, scene: Three.Scene, x: number, y: number)
	{
		this.intersections.clear()

		this.vec2.x = x
		this.vec2.y = y

		// this.raycaster.setFromCamera(this.vec2, camera)

		// const intersects = this.raycaster.intersectObjects(s_Scene.children, true)

		// for(const intersection of intersects)
		// {
		// 	const actor = intersection.object.actor
		// 	if(actor)
		// 	{
		// 		this.intersections.add(actor)
		// 	}
		// }
	}

	private vec2 = new Three.Vector2;
	private raycaster = new Three.Raycaster;
}
