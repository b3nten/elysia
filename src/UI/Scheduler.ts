import type { ElysiaElement } from "./ElysiaElement.ts";

export class Scheduler
{
	frametime: number = 0;

	components: Set<ElysiaElement> = new Set;

	update()
	{
		const t = performance.now();
		for (const component of this.components) {
			component.requestUpdate();
		}
		this.frametime = performance.now() - t;
	}

	beginAutomaticUpdateLoop(): void
	{
		if(!this.#autoUpdating)
		{
			this.#autoUpdating = true;
			requestAnimationFrame(this.autoUpdateCallback);
		}
	}

	stopAutomaticUpdateLoop(): void
	{
		this.#autoUpdating = false;
	}

	private autoUpdateCallback = () =>
	{
		if(!this.#autoUpdating) return;
		requestAnimationFrame(this.autoUpdateCallback)
		this.update();
	}

	subscribe(component: ElysiaElement)
	{
		this.components.add(component);
	}

	unsubscribe(component: ElysiaElement)
	{
		this.components.delete(component);
	}

	#autoUpdating = false;
}

export const defaultScheduler: Scheduler = new Scheduler;
