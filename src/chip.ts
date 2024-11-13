import $ from 'jquery';
import { css, html } from 'lit';
import { List, randomInt } from 'utilium';
import { Component } from './component.js';
import type { Pin } from './pin.js';
import type { ChipData } from './static.js';

export abstract class Chip extends Component {
	declare ['constructor']: ChipMetadata & typeof Chip;

	static randomColor(): string {
		return '#' + randomInt(222, 999);
	}

	static color = this.randomColor();

	static styles = css`
		:host {
			position: absolute;
			min-width: 1em;
			min-height: 1em;
			border-radius: 0.25em;
		}

		:host([dragging]) {
			cursor: grabbing;
		}

		p {
			margin: 1em;
		}
	`;

	public pins = new List<Pin>();

	public get inputs(): List<Pin> {
		return new List(this.pins.toArray().filter(pin => pin.isInput));
	}

	public get outputs(): List<Pin> {
		return new List(this.pins.toArray().filter(pin => !pin.isInput));
	}

	public constructor() {
		super();
		this.canMove = true;
		this.style.backgroundColor = this.constructor.color;
	}

	protected updated(_: Map<PropertyKey, unknown>): void {
		super.updated(_);
		this.style.transform = `translate(${this.x}px, ${this.y}px)`;
		for (const pin of this.pins) {
			pin.requestUpdate();
		}
	}

	public abstract Update(): void;

	public remove(): void {
		super.remove();
		for (const pin of this.pins) {
			pin.remove();
		}
	}

	public render() {
		const ctor = this.constructor;

		return html`
			<p>${ctor.display || ctor.name}</p>
			${this.pins.toArray()}
		`;
	}
}

export function chip_eval(chip: ChipData, input_values: boolean[]): boolean[] {
	const inputs = chip.chips.filter(chip => chip.kind == 'input').map(s => s.kind);

	return [];
}

export class CustomChip extends Chip {
	public constructor(public readonly data: ChipData) {
		super();
	}

	public Update(): void {
		const inputs = this.inputs.toArray().map(input => input.state);

		const out_values = chip_eval(this.data, inputs);

		const out_pins = this.outputs;

		for (let i = 0; i < out_pins.size; i++) {
			out_pins.at(i).set(out_values[i]);
		}
	}
}

export interface ChipMetadata {
	id: string;
	display: string;
	builtin: boolean;
}

export type ChipLike = new () => Chip;

export const chips = new Map<string, ChipLike>();

export function register({ id, display, builtin = false }: Partial<ChipMetadata>) {
	return function <T extends ChipLike>(target: T): T & ChipMetadata {
		id ||= target.name.toLowerCase();
		display ||= target.name;
		customElements.define('sim-chip-' + id.replaceAll(':', '-'), target);
		chips.set(id, target);
		$('<option />')
			.val(id)
			.text(display)
			.appendTo('optgroup.' + (builtin ? 'builtin' : 'project'));

		return Object.assign(target, { id, display, builtin });
	};
}
