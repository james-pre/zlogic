import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Chip } from './chip.js';
import { Component } from './component.js';

@customElement('sim-pin')
export class Pin extends Component {
	/**
	 *
	 */
	@property() public accessor state: boolean = false;

	public constructor(
		public chip: Chip,
		public isInput: boolean
	) {
		super();
		chip.pins.add(this);
	}

	public set(state: boolean): void {
		this.state = state;
		this.update();
	}

	public update(): void {
		this.chip.update();
	}

	public render() {
		return html`<circle cx="0" cy="0" r="1" fill="#f00" />`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'sim-pin': Pin;
	}
}
