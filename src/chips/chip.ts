import $ from 'jquery';
import { css, html } from 'lit';
import { List, pick } from 'utilium';
import { Component } from '../component.js';
import type { Pin } from '../pin.js';
import { chipHeightScaling, type SubChip } from '../static.js';
import { randomColor } from '../utils.js';

export abstract class Chip<Config = unknown> extends Component {
	declare ['constructor']: ChipStatic;

	static styles = [
		super.styles,
		css`
			:host {
				position: absolute;
				min-width: 1em;
				min-height: 1em;
				border-radius: 0.25em;
			}

			p {
				margin: 1em;
			}
		`,
	];

	public pins = new List<Pin>();

	public get inputs(): List<Pin> {
		return new List(this.pins.toArray().filter(pin => pin.isInput));
	}

	public get outputs(): List<Pin> {
		return new List(this.pins.toArray().filter(pin => !pin.isInput));
	}

	public constructor() {
		super({ canMove: true, autoPosition: true });
	}

	protected updated(_: Map<PropertyKey, unknown>): void {
		super.updated(_);
		this.style.backgroundColor = this.constructor.color || randomColor();

		const { inputs, outputs } = Object.groupBy(this.pins, pin => (pin.isInput ? 'inputs' : 'outputs'));
		const maxOnSide = Math.max(inputs?.length || 0, outputs?.length || 0);
		this.style.minHeight = maxOnSide * chipHeightScaling - 1 + 'em';
		for (const pin of this.pins) {
			pin.requestUpdate();
		}
	}

	public setup?(config?: Config): unknown;

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

	public toJSON(): SubChip {
		const data: SubChip = {
			...pick(this, 'x', 'y'),
			kind: this.constructor.id,
		};

		if ('label' in this && this.label) data.label = this.label;
		return data;
	}
}

export interface ChipLike {
	new (): Chip;
	id?: string;
	builtin?: boolean;
	display?: string;
	color?: string;
	eval(inputs: boolean[]): boolean[];
}

export interface ChipStatic extends Required<ChipLike> {
	new (): Chip;
	id: string;
}

export const chips = new Map<string, ChipStatic>();

/**
 * We use a function since that is the only way to assert a type in TS
 */
function __initChipStatic<T extends ChipLike>(chip: T): asserts chip is T & ChipStatic {
	chip.id ||= chip.name.toLowerCase();
	let i = 0;
	while (chips.has(chip.id)) i++;
	if (i) chip.id += i.toString(16);
	chip.display ||= chip.name;
	chip.builtin ??= false;
	chip.color ??= randomColor();
}

export function register<const T extends ChipLike>(chip: T): T & ChipStatic {
	__initChipStatic(chip);
	customElements.define('sim-chip-' + chip.id, chip);
	chips.set(chip.id, chip);
	$('<option />')
		.val(chip.id)
		.text(chip.display)
		.attr('data-chip-id', chip.id)
		.appendTo('optgroup.' + (chip.builtin ? 'builtin' : 'project'));

	return chip;
}
