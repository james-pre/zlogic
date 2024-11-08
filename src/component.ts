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
