import type { ElysiaElement } from "./ElysiaElement.ts";

/**
 * Scheduler is a class that manages the update loop for all ElysiaElements subscribed to it.
 * It can be called manually using the update() method, or it can be set to automatically update
 * by calling beginAutomaticUpdateLoop(). The update loop can be stopped by calling stopAutomaticUpdateLoop().
 */
export class Scheduler
{
	frametime: number = 0;

	components: Set<ElysiaElement> = new Set;

	/*
	 * Updates all subscribed ElysiaElements.
	 */
	update()
	{
		const t = performance.now();
		for (const component of this.components) {
			component.requestUpdate();
		}
		this.frametime = performance.now() - t;
	}

	/*
	 * Begins an automatic update loop that calls update() every frame.
	 */
	beginAutomaticUpdateLoop(): void
	{
		if(!this.#autoUpdating)
		{
			this.#autoUpdating = true;
			requestAnimationFrame(this.autoUpdateCallback);
		}
	}

	/*
	 * Stops the automatic update loop.
	 */
	stopAutomaticUpdateLoop(): void
	{
		this.#autoUpdating = false;
	}

	/** @internal */
	subscribe(component: ElysiaElement)
	{
		this.components.add(component);
	}

	/** @internal */
	unsubscribe(component: ElysiaElement)
	{
		this.components.delete(component);
	}

	private autoUpdateCallback = () =>
	{
		if(!this.#autoUpdating) return;
		requestAnimationFrame(this.autoUpdateCallback)
		this.update();
	}

	#autoUpdating = false;
}

export const defaultScheduler: Scheduler = new Scheduler;
