import { css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Chip } from './chips/chip.js';
import { Component } from './component.js';
import { connectWire, element } from './editor.js';
import type { Wire } from './wire.js';
import { colorState } from './utils.js';

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

	public wires = new Set<Wire>();

	public constructor(
		public chip: Chip,
		/**
		 * Whether this pin is input for the chip
		 */
		public isInput: boolean,
		/**
		 * Whether this pin is at the top level (i.e. i/o for the chip being edited)
		 */
		public isTop: boolean = false
	) {
		super();
		chip.pins.add(this);
		this.canMove = isTop;

		this.addEventListener('click', (e: MouseEvent) => {
			connectWire(this);
			e.stopPropagation();
		});
	}

	public set(state: boolean): void {
		this.state = state;
		this.Update();
	}

	public offsets() {
		const { left, top } = element.offset()!;
		const { x, y, width, height } = this.getBoundingClientRect();

		return {
			x: x - left + width / 2,
			y: y - top + height / 2,
		};
	}

	protected updated(_: Map<PropertyKey, unknown>): void {
		super.updated(_);
		this.style.backgroundColor = colorState(this.state);

		for (const wire of this.wires) {
			wire.requestUpdate();
		}

		const chipStyle = getComputedStyle(this.chip);

		if (this.isTop) {
			this.style.transform = `translate(${this.isInput ? '-1.5em' : `calc(${chipStyle.width} + 0.5em)`})`;
			return;
		}

		const pins = this.isInput ? this.chip.inputs : this.chip.outputs;
		const index = pins.toArray().indexOf(this);

		const x = this.isInput ? '-0.5em' : `calc(${chipStyle.width} - 0.5em)`,
			y = `calc(${(index - (pins.size - 1) / 2) * 20}px - calc(${chipStyle.height} / 2))`;

		this.style.transform = `translate(${x}, ${y})`;
	}

	public Update(): void {
		if (this.isInput || this.isTop) {
			this.chip.Update();
		}
		if (this.isInput) return;
		for (const wire of this.wires) {
			wire.Update();
		}
	}

	public remove(): void {
		super.remove();
		this.chip.pins.delete(this);
		for (const wire of this.wires) {
			wire.remove();
		}
	}
}
