/**
 * @module
 * Helper actors for creating basic 3D shapes.
 */

import { MeshActor } from "./MeshActor.ts";
// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three';

const primitiveMaterialMap = new Map<Three.ColorRepresentation, Three.MeshStandardMaterial>();

const box = new Three.BoxGeometry();
const sphere = new Three.SphereGeometry();
const cone = new Three.ConeGeometry();
const cylinder = new Three.CylinderGeometry();
const torus = new Three.TorusGeometry();
const plane = new Three.PlaneGeometry();
const ring = new Three.RingGeometry();

/**
 * A basic cube mesh actor.
 */
export class PrimitiveActor extends MeshActor
{
	// deno-lint-ignore constructor-super
	constructor(geometry: Three.BufferGeometry, color?: Three.ColorRepresentation | Three.Material)
	{
		if(color === undefined) color = 0xff0000;
		if(color instanceof Three.Material)
		{
			super(geometry, color);
		}
		else if(primitiveMaterialMap.has(color))
		{
			super(geometry, primitiveMaterialMap.get(color)!);
		}
		else
		{
			const material = new Three.MeshStandardMaterial({ color });
			primitiveMaterialMap.set(color, material);
			super(geometry, material);
		}
	}

	static Box(color?: Three.ColorRepresentation | Three.Material): PrimitiveActor
	{
		return new PrimitiveActor(box, color);
	}

	static Sphere(color?: Three.ColorRepresentation | Three.Material): PrimitiveActor
	{
		return new PrimitiveActor(sphere, color);
	}

	static Cone(color?: Three.ColorRepresentation | Three.Material): PrimitiveActor
	{
		return new PrimitiveActor(cone, color);
	}

	static Cylinder(color?: Three.ColorRepresentation | Three.Material): PrimitiveActor
	{
		return new PrimitiveActor(cylinder, color);
	}

	static Torus(color?: Three.ColorRepresentation | Three.Material): PrimitiveActor
	{
		return new PrimitiveActor(torus, color);
	}

	static Plane(color?: Three.ColorRepresentation | Three.Material): PrimitiveActor
	{
		return new PrimitiveActor(plane, color);
	}

	static Ring(color?: Three.ColorRepresentation | Three.Material): PrimitiveActor
	{
		return new PrimitiveActor(ring, color);
	}

}
