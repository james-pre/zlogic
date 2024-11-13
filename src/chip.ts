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

export function chip_eval(kind: string, input_values: boolean[]): boolean[] {
	const chip = chips.get(kind);

	if (!chip) throw 'Chip does not exist: ' + kind;

	if (chip.builtin) return chip.eval!(input_values);

	// Implement custom chips

	const { data } = chip as ChipMetadata & ChipLike & { data: ChipData };

	if (!data) throw 'Custom chip data missing: ' + kind;

	const subChips: Map<number, boolean[]> = new Map();
	const output_values: boolean[] = new Array(data.chips.length).fill(false) as boolean[];
	const evaluatedSubChips: Set<number> = new Set();

	// Identify input and output sub-chips
	const inputIndices = new Set<number>();
	const outputIndices = new Set<number>();

	data.chips.forEach((subChip, index) => {
		if (subChip.kind === 'input') {
			inputIndices.add(index);
		} else if (subChip.kind === 'output') {
			outputIndices.add(index);
		}
	});

	// Rule validation
	for (const wire of data.wires) {
		if (inputIndices.has(wire.to[0])) {
			throw new Error(`Invalid wire configuration: Input chip at index ${wire.to[0]} appears in 'to' field of a wire.`);
		}
		if (outputIndices.has(wire.from[0])) {
			throw new Error(`Invalid wire configuration: Output chip at index ${wire.from[0]} appears in 'from' field of a wire.`);
		}
	}

	// Initialize inputs for "input" kind sub-chips, allowing multiple inputs
	for (const [index, value] of input_values.entries()) {
		const inputChip = data.chips[index];
		if (inputChip && inputChip.kind === 'input') {
			const chipInputs = subChips.get(index) || [];
			chipInputs.push(value);
			subChips.set(index, chipInputs);
		}
	}

	// Process wires to propagate values
	let currentSubChips = new Set<number>(Array.from(inputIndices));

	while (currentSubChips.size > 0) {
		const nextSubChips = new Set<number>();

		for (const index of currentSubChips) {
			const inputs = subChips.get(index) || [];

			// Step 5a: Throw error if the sub-chip is of kind "input"
			if (data.chips[index].kind === 'input') {
				throw `Invalid chip evaluation flow: sub-chip at index ${index} is an "input" chip.`;
			}

			// Step 5b: Throw error if the sub-chip has already been evaluated
			if (evaluatedSubChips.has(index)) {
				throw `Invalid chip evaluation flow: sub-chip at index ${index} has already been evaluated.`;
			}

			// Evaluate the sub-chip outputs and store results
			const subOutputs = chip_eval(data.chips[index].kind, inputs);
			evaluatedSubChips.add(index);

			// Step 5c: Check if the sub-chip is an "output" chip
			if (data.chips[index].kind === 'output') {
				output_values[index] = subOutputs[0];
			} else {
				// Step 5d: Store evaluated sub-chip's outputs and mark for further propagation
				subChips.set(index, subOutputs);
				nextSubChips.add(index);
			}

			// Propagate output through wires to other sub-chips
			for (const wire of data.wires) {
				if (wire.from[0] === index) {
					const targetSubChip = wire.to[0];
					const toChipInputs = subChips.get(targetSubChip) || [];
					toChipInputs[wire.to[1]] = subOutputs[wire.from[1]];
					subChips.set(targetSubChip, toChipInputs);
					nextSubChips.add(targetSubChip);
				}
			}
		}

		// Move to the next layer of sub-chips to evaluate
		currentSubChips = nextSubChips;
	}

	return output_values;
}

export class CustomChip extends Chip {
	declare ['constructor']: ChipMetadata & typeof Chip & { data: ChipData };

	public Update(): void {
		const inputs = this.inputs.toArray().map(input => input.state);

		const out_values = chip_eval(this.constructor.id, inputs);

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
	eval?(inputs: boolean[]): boolean[];
}

export type ChipLike = new () => Chip;

export const chips = new Map<string, ChipLike & ChipMetadata>();

export function register({ id, display, builtin = false }: Partial<ChipMetadata>) {
	return function <T extends ChipLike>(target: T): T & ChipMetadata {
		id ||= target.name.toLowerCase();
		display ||= target.name;
		customElements.define('sim-chip-' + id.replaceAll(':', '-'), target);
		const _ = Object.assign(target, { id, display, builtin });
		chips.set(id, _);
		$('<option />')
			.val(id)
			.text(display)
			.appendTo('optgroup.' + (builtin ? 'builtin' : 'project'));

		return _;
	};
}
