/**
 * @module ElysiaElement
 * @description Provides the core building block for creating web components using an Immediate Mode UI pattern.
 *
 * The ElysiaElement class extends HTMLElement and provides a structured way to create custom elements with:
 * - Lifecycle management (mount, unmount, render hooks)
 * - Automatic update scheduling and optimization
 * - Shadow DOM initialization and style management
 * - Visibility-based rendering optimization
 * - Declarative template rendering using lit-html
 *
 *
 * Unlike other UI paradigms, immediate mode UI does not reqire reactivity or manual tracking of updates. Instead,
 * the template is dirty checked for changes and only triggers updates when the template has changed.
 * The template uses lit-html for declarative rendering and is automatically updated when the template changes.
 * By default, only the visible elements are rendered and updated, but this can be customized using the update strategy.
 *
 * Checking of the template uses strict equality for primitives and objects, recursively checks elements in arrays and nested templates, and uses the `name property` for methods and functions.
 *
 * @example
 * ```typescript
 * import { ElysiaElement, html, defineComponent } from './ElysiaElement';
 *
 * class MyCounter extends ElysiaElement {
 *   static override Tag = 'my-counter';
 *   static override Styles = `
 *     :host { display: block; }
 *     button { padding: 8px; }
 *   `;
 *
 *   private count = 0;
 *
 *   protected override onRender() {
 *     return html`
 *       <button @click=${() => this.count++}>
 *         Count: ${this.count}
 *       </button>
 *     `;
 *   }
 * }
 *
 * defineComponent(MyCounter);
 * ```
 */

export * from "./ElysiaSplash.ts";
export * from "./ElysiaElement.ts";
export * from "./Scheduler.ts";
export * from "./ElysiaStats.ts";
export * from "./Css.ts";
export * from "./DefineComponent.ts";
export * from "./UpdateStrategy.ts";
export * from "./Theme.ts";
export * from "./ElysiaImmediateElement.ts";
export * from "./ElysiaCrossHair.ts";
export * from "./Internal.ts";
