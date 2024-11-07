/**
 * @module
 * Helper actors for creating basic 3D shapes.
 */

import { MeshActor } from "./MeshActor.ts";
// @ts-types="npm:@types/three@^0.169.0"
import * as Three from 'three';

const primitiveMaterialMap = new Map<Three.ColorRepresentation, Three.MeshStandardMaterial>();

/**
 * A basic cube mesh actor.
 */
export class CubeActor extends MeshActor
{
	// deno-lint-ignore constructor-super
	constructor(color?: Three.ColorRepresentation)
	{
		if(color === undefined) color = 0xff0000;

		if(primitiveMaterialMap.has(color))
		{
			super(new Three.BoxGeometry(), primitiveMaterialMap.get(color)!);
		}
		else
		{
			const material = new Three.MeshStandardMaterial({ color });
			primitiveMaterialMap.set(color, material);
			super(new Three.BoxGeometry(), material);
		}
	}
}

/**
 * A basic sphere actor.
 */
export class SphereActor extends MeshActor
{
	override get material(): Three.MeshStandardMaterial { return this.object3d.material as Three.MeshStandardMaterial; }

	constructor(color?: Three.ColorRepresentation, position?: Three.Vector3, radius = 1)
	{
		super(new Three.SphereGeometry(), new Three.MeshStandardMaterial({ color }));

		if(position)
		{
			this.object3d.position.copy(position);
		}

		this.object3d.scale.set(radius, radius, radius);
	}
}

/**
 * A basic plane actor.
 */
export class PlaneActor extends MeshActor
{
	constructor(color?: Three.ColorRepresentation, position?: Three.Vector3, rotation?: Three.Euler, scale?: Three.Vector3)
	{
		super(new Three.PlaneGeometry(), new Three.MeshStandardMaterial({ color }));

		if(position)
		{
			this.object3d.position.copy(position);
		}

		if(rotation)
		{
			this.object3d.rotation.copy(rotation);
		}

		if(scale)
		{
			this.object3d.scale.copy(scale);
		}
	}
}

/**
 * A basic cylinder actor.
 */
export class CylinderActor extends MeshActor
{
	get radius(): number { return this.object3d.scale.x; }
	set radius(value: number) { this.object3d.scale.set(value, this.object3d.scale.y, value); }

	get height(): number { return this.object3d.scale.y; }
	set height(value: number) { this.object3d.scale.set(this.object3d.scale.x, value, this.object3d.scale.z); }

	constructor(color?: Three.ColorRepresentation, position?: Three.Vector3, radius = 1, height = 1)
	{
		super(new Three.CylinderGeometry(), new Three.MeshStandardMaterial({ color }));

		if(position)
		{
			this.object3d.position.copy(position);
		}

		this.object3d.scale.set(radius, height, radius);
	}
}

/**
 * A basic cone actor.
 */
export class ConeActor extends MeshActor
{
	get radius(): number { return this.object3d.scale.x; }
	set radius(value: number) { this.object3d.scale.set(value, this.object3d.scale.y, value); }

	get height(): number { return this.object3d.scale.y; }
	set height(value: number) { this.object3d.scale.set(this.object3d.scale.x, value, this.object3d.scale.z); }

	constructor(color?: Three.ColorRepresentation, position?: Three.Vector3, radius = 1, height = 1)
	{
		super(new Three.ConeGeometry(), new Three.MeshStandardMaterial({ color }));
		// @ts-ignore - augmenting object3d
		this.object3d.actor = this;

		if(position)
		{
			this.object3d.position.copy(position);
		}

		this.object3d.scale.set(radius, height, radius);
	}
}

/**
 * A basic torus actor.
 */
export class TorusActor extends MeshActor
{
	get radius(): number { return this.object3d.scale.x; }
	set radius(value: number) { this.object3d.scale.set(value, this.object3d.scale.y, value); }

	get tube(): number { return this.object3d.scale.z; }
	set tube(value: number) { this.object3d.scale.set(this.object3d.scale.x, this.object3d.scale.y, value); }

	constructor(color?: Three.ColorRepresentation, position?: Three.Vector3, radius = 1, tube = 0.4)
	{
		super(new Three.TorusGeometry(), new Three.MeshStandardMaterial({ color }));

		if(position)
		{
			this.object3d.position.copy(position);
		}

		this.object3d.scale.set(radius, radius, tube);
	}
}
