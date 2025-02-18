import {AutoInitMap} from "../containers/autoinitmap.ts";

export interface IComponent {
	/** Called when the component is added to an actor. */
	onStart?(): void;
	/** Called after physics calculations are done. */
	onPhysicsUpdate?(): void;
	/** Called before the update loop. */
	onPreUpdate?(): void;
	/** Called during the update loop. */
	onUpdate?(): void;
	/** Called after the update loop. */
	onPostUpdate?(): void;
	/** Called after the render loop. */
	onPostRender?(): void;
	/** Called when the component is removed from an actor. */
	onEnd?(): void;
}


export class TagSystem {
	addComponentWithTags(component: IComponent, ...tags: any[]) {
		for (let tag of tags) {
			this._tags.get(tag).add(component);
		}
	}

	removeTagsFromComponent(component: IComponent, ...tags: any[]) {
		for (let tag of tags) {
			this._tags.get(tag).delete(component);
		}
	}

	getComponentsWithTag(tag: any) {
		return this._tags.get(tag);
	}

	getComponentsWithTags(out: Set<IComponent>, ...tags: any[]) {
		out.clear();
		for (let tag of tags) {
			for (let component of this._tags.get(tag)) {
				out.add(component);
			}
		}
		return out;
	}

	clear() {
		this._tags.clear();
	}

	protected _tags = new AutoInitMap<any, Set<IComponent>>(() => new Set)
}
