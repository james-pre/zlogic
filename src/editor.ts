import $ from 'jquery';
import { List } from 'utilium';
import { download } from 'utilium/dom.js';
import { Chip, chips as chipConstructors } from './chips/chip.js';
import { Input } from './chips/index.js'; // Need side-effects
import type { Pin } from './pin.js';
import type { ChipData, ChipFile, EditorState } from './static.js';
import { popup, randomColor } from './utils.js';
import { Wire, removePendingWire, pendingWire, addPendingWire } from './wire.js';

export const element = $('#editor'),
	toolbar = $('#toolbar');

export function clear(): void {
	for (const chip of chips) {
		chip.remove();
	}
	for (const wire of wires) {
		wire.remove();
	}
	toolbar.find('input').not('.color').val('');
	toolbar.find<HTMLInputElement>('input.color').val(randomColor());
}

export function open(): void {
	$('#editor-container .closed').hide();
	$('#editor-container .open').show();
}

export function close(): void {
	$('#editor-container .open').hide();
	$('#editor-container .closed').show();
}

export const { left: x, top: y } = element.offset()!;

export const chips = new List<Chip>(),
	wires = new List<Wire>();

export function addChip(id: string): Chip {
	const ChipCtor = chipConstructors.get(id);
	if (!ChipCtor) {
		throw 'Component does not exist';
	}
	if (id == toolbar.find('input.id').val()) {
		throw 'Can not add a chip to itself';
	}

	const subChip = new ChipCtor();
	subChip.addEventListener('remove', () => chips.delete(subChip));
	chips.add(subChip);
	element.append(subChip);
	return subChip;
}

export function inputs(): Input[] {
	return chips.toArray().filter(chip => chip instanceof Input);
}

toolbar.find<HTMLSelectElement>('select.add').on('change', e => {
	if (!e.target.value) {
		return;
	}

	try {
		addChip(e.target.value);
	} catch (text: any) {
		void popup(false, text as string);
	}
	e.target.value = '';
});

export function connectWire(this: Pin, event: MouseEvent) {
	event.stopPropagation();
	if (addPendingWire(this)) return;
	const wire = pendingWire!; // alias for in the event listener
	const last = wire.lastItem();
	if (event.shiftKey && !last.isKind<Pin>('Pin')) {
		const { x, y } = this.offsets();
		if (Math.abs(last.x - x) > Math.abs(last.y - y)) {
			last.y = y;
		} else {
			last.x = x;
		}
	}
	wire.complete(this);
	wire.addEventListener('remove', () => wires.delete(wire));
	wires.add(wire);
	removePendingWire();
}

element.on('click', e => {
	if (pendingWire && !(e.target instanceof Chip)) {
		const { left, top } = element.offset()!;

		let anchorX = e.clientX - left;
		let anchorY = e.clientY - top;

		if (e.shiftKey) {
			// Snapping logic: Snap along the nearest axis (x or y)
			const last = pendingWire.lastItem();

			if (Math.abs(anchorX - last.x) > Math.abs(anchorY - last.y)) {
				anchorY = last.y;
			} else {
				anchorX = last.x;
			}
		}

		pendingWire.addAnchor(anchorX, anchorY);
	}
});

export function load(data: ChipData): void {
	clear();
	toolbar.find('input.id').val(data.id);
	toolbar.find('input.name').val(data.name);
	toolbar.find('input.color').val(data.color);

	for (const { kind, x, y } of data.chips) {
		const chip = addChip(kind);
		chip.x = x;
		chip.y = y;
	}

	for (const { from, to, anchors } of data.wires) {
		const wire = new Wire(chips.at(from[0]).outputs.at(from[1]));

		for (const [x, y] of anchors) {
			wire.addAnchor(x, y);
		}
		wire.complete(chips.at(to[0]).inputs.at(to[1]));
		wire.addEventListener('remove', () => {
			wires.delete(wire);
		});
		wires.add(wire);
		element.append(wire);
	}
}

export function serialize(): ChipData {
	const chipList = chips.toArray();
	const name = toolbar.find<HTMLInputElement>('input.name').val() || '';
	const id = toolbar.find<HTMLInputElement>('input.id').val() || name.toLowerCase().replaceAll(/[\W\s]/g, '_');
	const color = toolbar.find<HTMLInputElement>('input.color').val() || randomColor();

	return {
		id,
		name,
		color,
		chips: chipList.map(chip => ({ kind: chip.constructor.id, x: chip.x, y: chip.y })),
		wires: wires.toArray().map(wire => {
			const in_chip = wire.input.chip;
			const in_pin = in_chip.outputs.toArray().indexOf(wire.input);

			const out_chip = wire.output!.chip;
			const out_pin = out_chip.inputs.toArray().indexOf(wire.output!);

			return {
				from: [chipList.indexOf(in_chip), in_pin],
				to: [chipList.indexOf(out_chip), out_pin],
				anchors: wire.anchors.toArray().map(a => [+a.x.toFixed(), +a.y.toFixed()]),
			};
		}),
	};
}

export function state(): EditorState {
	return {
		input: inputs().map(input => +input.pin.state as 0 | 1),
	};
}

toolbar.find<HTMLSelectElement>('button.download').on('click', e => {
	const chipFile: ChipFile = {
		version: 0,
		file: 'chip',
		chip: serialize(),
	};

	download(JSON.stringify(chipFile), 'chip.json');
});

toolbar.find('button.reset').on('click', clear);

$('#chip-create').on('click', clear);
