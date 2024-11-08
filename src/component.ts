import $ from 'jquery';
import { LitElement } from 'lit';
import { randomID } from './utils.js';
import { property } from 'lit/decorators.js';

export abstract class Component extends LitElement {
	/**
	 * User-facing name of the component
	 */
	@property() public accessor name = '';

	@property() public accessor x: number = 0;

	@property() public accessor y: number = 0;

	public id: string = randomID();

	abstract update(): void;
}

export type ComponentLike = { displayName?: string } & (new (...args: any[]) => Component);

export const components = new Map<string, ComponentLike>();

export function register<const T extends ComponentLike>(target: T, context: ClassDecoratorContext<T>) {
	components.set(target.name, target);
	$('<option />')
		.text(target.displayName || target.name)
		.appendTo('select.add');
}
