import type { IComponent } from "../core/component.ts";

export class TagComponent implements IComponent {

    has(tag: any) {
        return this._tags.has(tag);
    }

    add(tag: any) {
        this._tags.add(tag);
    }

    remove(tag: any) {
        this._tags.delete(tag);
    }

    clear() {
        this._tags.clear();
    }

    protected _tags: Set<any> = new Set();

}