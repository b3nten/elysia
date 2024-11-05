/**
 * @module
 *
 * @description A collection of mathematical utilities for game development including easing functions,
 * vector operations, interpolation, and general math helpers.
 *
 * The module consists of several sub-components:
 *
 * Easings - A comprehensive collection of easing functions for smooth animations
 * and transitions. Includes common patterns like linear, quadratic, cubic, elastic, and bounce.
 * All easing functions accept a progress value between 0 and 1 and return a transformed value.
 *
 * Damp - Provides smooth interpolation utilities with frame-rate independent
 * damping. The lerpSmooth function prevents overshooting and provides natural-feeling transitions
 * for both numbers and vectors.
 *
 * Vectors - Defines vector-related types and type guards for 2D, 3D, and 4D
 * vectors. Includes utilities for vector type checking and validation.
 *
 * Other - General mathematical utilities including:
 * - clamp: Constrains a value between min and max
 * - remap: Remaps a value from one range to another
 * - lerp: Linear interpolation between two values
 * - slerp: Spherical linear interpolation
 *
 * @example Easing functions
 * ```ts
 * const smoothValue = easeInOutQuad(0.5); // Returns eased value at 50% progress
 * ```
 * @example Smooth damping
 * ```ts
 * lerpSmooth(currentPos, targetPos, deltaTime, 0.1);
 * ```
 * @example Vector operations
 * ```ts
 * const vec = { x: 1, y: 2 };
 * if (isVector2Like(vec)) {
 *   // Work with 2D vector
 * }
 * ```
 * @example General math utilities
 * ```ts
 * const clampedValue = clamp(value, 0, 1);
 * const remappedValue = remap(value, 0, 1, -1, 1);
 * ```
 */

export * from "./Easings.ts";
export * from "./Damp.ts";
export * from "./Other.ts";
export * from "./Vectors.ts";
