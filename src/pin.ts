import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Chip } from './chip.js';
import { Component } from './component.js';

@customElement('sim-pin')
export class Pin extends Component {
	public static styles = css`
		:host {
			border-radius: 25%;
		}
	`;

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
		chip.append(this);
	}

	public set(state: boolean): void {
		this.state = state;
		this.Update();
	}

	public Update(): void {
		this.chip.Update();
	}
}
