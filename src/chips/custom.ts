import { List } from 'utilium';
import { Pin } from '../pin.js';
import type { ChipData, SubChip } from '../static.js';
import { Chip, chips, type ChipStatic } from './chip.js';

export type CustomStaticLike = ChipStatic & { data: ChipData };

export class CustomChip extends Chip {
	declare ['constructor']: CustomStaticLike;

	public constructor() {
		super();

		for (const chip of this.constructor.data.chips) {
			if (chip.kind != 'input' && chip.kind != 'output') continue;
			const pin = new Pin(this, chip.kind == 'input', false);
			if (chip.label) pin.label = chip.label;
		}
	}

	public Update(): void {
		const inputs = this.inputs.toArray().map(input => input.state);

		const out_values = chip_eval(this.constructor.id, inputs);

		const out_pins = this.outputs;

		for (let i = 0; i < out_pins.size; i++) {
			out_pins.at(i).set(out_values[i]);
		}
	}
}

/**
 * Get the outputs of a chip
 */
export function chip_eval(kind: string, input_values: boolean[], _debug: boolean = false): boolean[] {
	if (kind == 'output') {
		if (_debug) console.debug('[chip_eval] (output)', input_values);
		return input_values;
	}

	const chip = chips.get(kind);

	if (!chip) throw 'Chip does not exist: ' + kind;

	if (chip.eval) {
		const out = chip.eval(input_values);
		if (_debug) console.debug('[chip_eval] (static)', kind, input_values, out);
		return out;
	}

	if (chip.builtin) {
		throw 'Built-in chip can not be dynamically evaluated: ' + kind;
	}

	if (_debug) console.group('[chip_eval] (dynamic)', kind, input_values);

	// Dynamic eval for custom chips

	const { data } = chip as CustomStaticLike;

	if (!data) throw 'Custom chip data missing: ' + kind;

	const subChips: Map<number, boolean[]> = new Map();
	const output_values: boolean[] = new Array(data.chips.length).fill(false) as boolean[];
	const evaluatedSubChips: Set<number> = new Set();

	// Identify input and output sub-chips
	const inputIndices = new List<number>();
	const outputIndices = new List<number>();

	for (const [i, subChip] of data.chips.entries()) {
		if (subChip.kind === 'input') {
			inputIndices.add(i);
		} else if (subChip.kind === 'output') {
			outputIndices.add(i);
		}
	}
	if (_debug) console.debug(inputIndices.size, 'inputs,', outputIndices.size, 'outputs');

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
	for (let iV = 0; iV < inputIndices.size; iV++) {
		const iC = inputIndices.at(iV);

		if (_debug) console.debug('init input', iV, iC);
		const chipInputs = subChips.get(iC) || [];
		chipInputs.push(input_values[iV]);
		subChips.set(iC, chipInputs);
	}

	// Process wires to propagate values
	let currentSubChips = new Set<number>(inputIndices);

	let depth = 0;

	while (currentSubChips.size > 0) {
		const nextSubChips = new Set<number>();

		if (_debug) console.group('depth', depth);

		for (const i of currentSubChips) {
			// Throw error if the sub-chip has already been evaluated
			if (evaluatedSubChips.has(i) && !chips.get(data.chips[i].kind)?.builtin) {
				throw `sub-chip at index ${i} has already been evaluated.`;
			}

			if (!subChips.has(i)) throw 'Missing input data for sub-chip at index ' + i;

			// Evaluate the sub-chip outputs and store results
			const subOutputs = chip_eval(data.chips[i].kind, subChips.get(i)!);
			evaluatedSubChips.add(i);

			// Check if the sub-chip is an "output" chip
			if (data.chips[i].kind == 'output') {
				if (_debug) console.debug('set output', i, 'to', subOutputs[0]);
				output_values[i] = subOutputs[0];
			} else {
				// Store evaluated sub-chip's outputs
				subChips.set(i, subOutputs);
			}

			// Propagate output through wires to other sub-chips
			for (const wire of data.wires) {
				if (wire.from[0] != i) continue;
				const toChipInputs = subChips.get(wire.to[0]) || [];
				toChipInputs[wire.to[1]] = subOutputs[wire.from[1]];
				subChips.set(wire.to[0], toChipInputs);
				nextSubChips.add(wire.to[0]);
				if (_debug) console.debug('update', wire.from.join(','), '---', wire.to.join(','));
			}
		}

		if (_debug) console.debug('evaled', [...currentSubChips].join(','), 'next', [...nextSubChips].join(','));

		// Move to the next layer of sub-chips to evaluate
		currentSubChips = nextSubChips;
		depth++;

		if (_debug) console.groupEnd();
	}

	if (_debug) {
		console.debug(output_values);
		console.groupEnd();
	}
	return output_values.filter((v, i) => data.chips[i].kind == 'output');
}

/**
 * Sorts sub-chips based on dependency
 */
export function chip_sort_sub(data: ChipData): [number, SubChip][] {
	const dependencies = new Map<number, Set<number>>();
	const dependentOn = new Map<number, Set<number>>();

	for (const i of data.chips.keys()) {
		dependencies.set(i, new Set());
		dependentOn.set(i, new Set());
	}

	for (const { from, to } of data.wires) {
		dependencies.get(from[0])!.add(to[0]);
		dependentOn.get(to[0])!.add(from[0]);
	}

	// Step 2: Topologically sort sub-chips using Kahn's Algorithm
	const sorted: [number, SubChip][] = [];
	const noDependencyNodes: number[] = Array.from(dependencies.keys()).filter(i => !dependentOn.get(i)!.size);

	while (noDependencyNodes.length > 0) {
		const node = noDependencyNodes.shift()!;
		sorted.push([node, data.chips[node]]);

		for (const dependent of dependencies.get(node)!) {
			const deps = dependentOn.get(dependent)!;
			deps.delete(node);
			if (!deps.size) {
				noDependencyNodes.push(dependent);
			}
		}
	}

	return sorted;
}

/**
 * "Compiles" the chip into a JS sub-set
 */
export function chip_compile(chip: ChipData | ChipStatic, pretty: boolean = false): string {
	if (typeof chip == 'function' && chip.builtin) {
		throw 'Built-in chip can not be compiled: ' + chip.name;
	}

	const data = typeof chip != 'function' ? chip : (chip as CustomStaticLike).data;
	if (!data) throw 'Custom chip data missing: ' + chip.name;

	const end = pretty ? '\n' : ';',
		sep = pretty ? ', ' : ',';

	let code = '';
	const bindings: Map<number, string> = new Map();
	let inputIndex = 0;

	// Map inputs to $in[N] variables
	for (const [i, subChip] of data.chips.entries()) {
		if (subChip.kind == 'input') {
			bindings.set(i, `$in[${inputIndex++}]`);
		}
	}

	// Compile code for each sub-chip and wiring
	let counter = 0;
	for (const [i, { kind }] of chip_sort_sub(data)) {
		// Skip "input" kind chips, as they are already mapped
		if (kind == 'input') continue;

		// Define a new variable for the sub-chip's output
		const binding = '$' + counter++;
		bindings.set(i, binding);

		// Generate function call for each sub-chip based on its inputs
		const inputs = data.wires
			.filter(wire => wire.to[0] == i)
			.map(wire => {
				const binding = bindings.get(wire.from[0]);
				return binding?.startsWith('$in') ? binding : `${binding}[${wire.from[1]}]`;
			})
			.join(sep);

		if (kind == 'output') {
			bindings.set(i, inputs);
			continue;
		}

		code += `${binding}${pretty ? ' = ' : '='}${kind}(${inputs})${end}`;
	}

	// Map outputs directly to the return array, optimizing out `output` calls
	const returned = data.chips
		.map((subChip, i) => {
			if (subChip.kind == 'output') {
				const binding = bindings.get(i);
				return binding ? binding : null; // Access the first element if binding exists
			}
			return null;
		})
		.filter(v => v)
		.join(sep);

	code += `return [${returned}]`;

	// Return the compiled code as a string
	return code;
}

export type ChipEval = (inputs: boolean[]) => boolean[];

// These regular expressions are used to ensure that arbitrary code can not be executed

const id = String.raw`\$(\d+|in)`;
const index = String.raw`(\[\d+\])?`;
const args = String.raw`(${id}${index})?(,\s*${id}${index})*`;

const intRegex = new RegExp(String.raw`^(return\s*\[${args}\])|(${id}\s*=\s*(([\w_]+\(${args}\))|${id}))$`);

/**
 * Turns the compiled JS sub-set code into an executable JS function.
 *
 * Note that it will only have access to the chips loaded at link-time
 */
export function chip_link(code: string, id?: string): ChipEval {
	const instructions = code.split(/[\n;]/);
	for (let i = 0; i < instructions.length; i++) {
		const int = instructions[i];

		if (!intRegex.test(int)) {
			throw new Error(`Refusing to link, instruction ${i} is unsafe or invalid: \`${int}\``);
		}
	}

	const _chips = Object.fromEntries(
		[...chips].filter(([name, chip]) => typeof chip.eval == 'function' && name != id).map(([name, chip]) => [name, (...args: boolean[]) => chip.eval!(args)])
	);

	const args = `$in, {${Object.keys(_chips).join(', ')}}`,
		body = code.replaceAll(/\$\d+ =/g, 'let $&');

	// eslint-disable-next-line @typescript-eslint/no-implied-eval
	const __eval = new Function(args, body) as (inputs: boolean[], fn: typeof _chips) => boolean[];

	return (inputs: boolean[]) => __eval(inputs, _chips);
}

Object.assign(globalThis, { chip_compile, chip_link, chip_sort_sub });
