import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Chip } from './chips/chip.js';
import { Component } from './component.js';
import { connectWire, element } from './editor.js';
import type { Wire } from './wire.js';
import { colorState } from './utils.js';
import { chipHeightScaling } from './static.js';

@customElement('sim-pin')
export class Pin extends Component {
	public static styles = css`
		:host {
			display: block;
			position: absolute;
			border-radius: 50%;
			width: 1em;
			height: 1em;
			z-index: 3;
		}

		dfn {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
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
		super({ canMove: isTop });
		chip.pins.add(this);

		this.addEventListener('click', connectWire.bind(this));
	}

	public override get x(): number {
		return this.offsets().x;
	}

	public override get y(): number {
		return this.offsets().y;
	}

	public set(state: boolean): void {
		this.state = state;
		this.simUpdate();
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

		if (this.isTop) {
			this.style[this.isInput ? 'left' : 'right'] = '-1.5em';
			this.style.top = 'calc(50% - 0.5em)';
			return;
		}

		const pins = this.isInput ? this.chip.inputs : this.chip.outputs;
		const index = pins.toArray().indexOf(this);

		this.style[this.isInput ? 'left' : 'right'] = '-0.5em';
		const offset = !(pins.size % 2) ? index * chipHeightScaling : index * chipHeightScaling;
		this.style.top = offset + 'em';
	}

	public simUpdate(): void {
		if (this.isInput || this.isTop) {
			this.chip.simUpdate();
		}
		if (this.isInput) return;
		for (const wire of this.wires) {
			wire.simUpdate();
		}
	}

	public remove(): void {
		super.remove();
		this.chip.pins.delete(this);
		for (const wire of this.wires) {
			wire.remove();
		}
	}

	protected get displayLabel(): string {
		if (this.label) return this.label;
		const pins = this.isInput ? this.chip.inputs : this.chip.outputs;
		return `${this.isInput ? 'Input' : 'Output'} #${pins.toArray().indexOf(this) + 1}`;
	}

	public render() {
		return html` <dfn title="${this.displayLabel}"></dfn> `;
	}
}
