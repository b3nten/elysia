export enum OffscreenUpdateStrategy {
	/**
	 * The component is only updated when it is visible.
	 */
	Disabled,
	/**
	 * The component is updated each frame when it is visible or when it is near the visible area.
	 */
	HighPriority,
}
