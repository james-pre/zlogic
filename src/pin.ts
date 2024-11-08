import { css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Chip } from './chip.js';
import { Component } from './component.js';

@customElement('sim-pin')
export class Pin extends Component {
	public static styles = css`
		:host {
			display: block;
			position: absolute;
			border-radius: 50%;
			width: 1em;
			height: 1em;
		}
	`;

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
		this.Update();
	}

	protected updated(_: Map<PropertyKey, unknown>): void {
		super.updated(_);
		this.style.backgroundColor = this.state ? '#c44' : '#511';

		const pins = this.isInput ? this.chip.inputs : this.chip.outputs;
		const index = pins.toArray().indexOf(this);

		const chipStyle = getComputedStyle(this.chip);

		this.style.transform = `translate(${this.isInput ? '-0.5em' : `calc(${chipStyle.width} - 0.5em)`}, calc(${(index - (pins.size - 1) / 2) * 20}px - calc(${chipStyle.height} / 2)))`;
	}

	public Update(): void {
		this.chip.Update();
	}
}
