import type { BoundingBox, BoundingSphere } from "../math/vectors.ts";
/**
 * Interface for entities that have a volume in 3D space.
 */
export interface IBounded {
	/**
	 * Calculate and return the bounding box of this object.
	 */
	getBoundingBox(): BoundingBox;

	/**
	 * Calculate and return the bounding sphere of this object.
	 */
	getBoundingSphere(): BoundingSphere;
}
