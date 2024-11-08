import $ from 'jquery';
import { css, html, LitElement, type CSSResult } from 'lit';
import { property } from 'lit/decorators.js';
import { randomID } from './utils.js';

type Styles = CSSResult | Styles[];

export abstract class Component extends LitElement {
	/**
	 * User-facing name of the component
	 */
	@property() public accessor name = '';

	@property() public accessor x: number = 0;
	@property() public accessor y: number = 0;

	protected updated(_: Map<PropertyKey, unknown>): void {
		super.updated(_);
		this.style.position = 'absolute';
		this.style.transform = `translate(${this.x}px, ${this.y}px)`;
	}

	public id: string = randomID();

	/**
	 * Upper case because lit is dumb
	 */
	abstract Update(): void;

	public render() {
		return html`<div></div>`;
	}
}

export interface ComponentStatic {
	displayName?: boolean;
	isBuiltin?: boolean;
}

export type ComponentLike = ComponentStatic & (new () => Component);

export const components = new Map<string, ComponentLike>();

export function register(target: ComponentLike) {
	customElements.define('sim-' + target.name.toLowerCase(), target);
	components.set(target.name, target);
	$('<option />')
		.text(target.displayName || target.name)
		.appendTo('optgroup.' + (target.isBuiltin ? 'builtin' : 'project'));
}
