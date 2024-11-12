import $ from 'jquery';
import { Chip, chips as chipConstructors } from './chip.js';
import type { ChipData, ChipFile, EditorState, ProjectFile } from './definitions.js';
import type { Pin } from './pin.js';
import { alert } from './utils.js';
import { Wire } from './wire.js';
import { List } from 'utilium';
import { Input } from './builtin/io.js';
import { download } from 'utilium/dom.js';

export const element = $('#editor'),
	container = $('#editor-container');

export function clear(): void {}

export function open(): void {
	$('#menu').hide();
	container.show();
}

export const { left: x, top: y } = element.offset()!;

export const chips = new List<Chip>(),
	wires = new List<Wire>();

container.find<HTMLSelectElement>('select.add').on('change', e => {
	if (!e.target.value) {
		return;
	}

	const ChipCtor = chipConstructors.get(e.target.value);
	if (!ChipCtor) {
		void alert('Component does not exist');
		return;
	}

	const subChip = new ChipCtor();
	chips.add(subChip);
	element.append(subChip);
	e.target.value = '';
});

let pendingWire: Wire | null;

export function connectWire(pin: Pin) {
	if (pendingWire) {
		pendingWire.complete(pin);
		wires.add(pendingWire);
		pendingWire = null;
	} else {
		pendingWire = new Wire(pin);
		element.append(pendingWire);
	}
}

element.on('click', e => {
	if (pendingWire && !(e.target instanceof Chip)) {
		const { left, top } = element.offset()!;

		/**
		 * @todo add snapping support with shift
		 */
		pendingWire.addAnchor(e.clientX - left, e.clientY - top);
	}
});

export function toJSON(): ChipData {
	const chipList = chips.toArray();

	return {
		id: '',
		name: '',
		chips: chipList.map(chip => ({ kind: chip.constructor.id, x: chip.x, y: chip.y })),
		wires: wires.toArray().map(wire => {
			const in_chip = wire.input.chip;
			const in_pin = in_chip.pins.toArray().indexOf(wire.input);

			const out_chip = wire.output!.chip;
			const out_pin = out_chip.pins.toArray().indexOf(wire.output!);

			return {
				from: [chipList.indexOf(in_chip), in_pin],
				to: [chipList.indexOf(out_chip), out_pin],
				anchors: wire.anchors.map(a => [a.x, a.y]),
			};
		}),
	};
}

export function state(): EditorState {
	return {
		input: chips
			.toArray()
			.filter(chip => chip instanceof Input)
			.map(input => +input.pin.state as 0 | 1),
	};
}

container.find<HTMLSelectElement>('button.save').on('click', e => {
	console.log(toJSON());
});

container.find<HTMLSelectElement>('button.download').on('click', e => {
	const chipFile: ChipFile = {
		version: 0,
		file: 'chip',
		chip: toJSON(),
	};

	download(JSON.stringify(chipFile), 'chip.json');
});
