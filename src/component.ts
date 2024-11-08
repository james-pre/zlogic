import $ from 'jquery';
import { html, LitElement, type CSSResult } from 'lit';
import { property } from 'lit/decorators.js';
import { randomID } from './utils.js';
import { pick } from 'utilium';

export type ComponentStyles = CSSResult | ComponentStyles[];

export interface ComponentJSON {
	id: string;
	x: number;
	y: number;
	name: string;
}

export abstract class Component extends LitElement {
	/**
	 * User-facing name of the component
	 */
	@property() public accessor name = '';

	@property() public accessor x: number = 0;
	@property() public accessor y: number = 0;

	public id: string = randomID();

	/**
	 * Upper case because lit is dumb
	 */
	abstract Update(): void;

	public render() {
		return html`<div></div>`;
	}

	public toJSON(): ComponentJSON {
		return pick(this, 'id', 'x', 'y', 'name');
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
