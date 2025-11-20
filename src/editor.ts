import $ from 'jquery';
import { List } from 'utilium';
import { download } from 'utilium/dom.js';
import { Chip, chips as chipConstructors } from './chips/chip.js';
import { Input } from './chips/index.js'; // Need side-effects
import type { Pin } from './pin.js';
import type { ChipData, ChipFile, EditorState } from './static.js';
import { popup, randomColor, showError } from './utils.js';
import { Wire, WireAnchor, removePendingWire, pendingWire, addPendingWire } from './wire.js';
import { eventPosition } from './component.js';

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

export const chips = new List<Chip>(),
	wires = new List<Wire>(),
	anchors = new List<WireAnchor>();

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

// eslint-disable-next-line @typescript-eslint/no-misused-promises
toolbar.find<HTMLSelectElement>('select.add').on('change', async event => {
	if (!event.target.value) return;

	const chip = addChip(event.target.value);
	if (chip.setup) {
		try {
			await chip.setup();
		} catch (error) {
			showError(error);
		}
	}
	event.target.value = '';
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

element.on('click', event => {
	if (!pendingWire || event.target instanceof Chip) {
		return;
	}

	let { x, y } = eventPosition(event.originalEvent!);

	if (event.shiftKey) {
		// Snapping logic: Snap along the nearest axis (x or y)
		const last = pendingWire.lastItem();

		if (Math.abs(x - last.x) > Math.abs(y - last.y)) {
			y = last.y;
		} else {
			x = last.x;
		}
	}

	const anchor = new WireAnchor(x, y);
	anchor.addEventListener('remove', () => anchors.delete(anchor));
	anchor.wires.add(pendingWire);
	pendingWire.anchors.add(anchor);
	pendingWire.requestUpdate();
	anchors.add(anchor);
});

export async function load(data: ChipData): Promise<void> {
	clear();
	toolbar.find('input.id').val(data.id);
	toolbar.find('input.name').val(data.name);
	toolbar.find('input.color').val(data.color);

	for (const { kind, x, y, label, ...rest } of data.chips) {
		const chip = addChip(kind);
		await chip.setup?.(rest);
		Object.assign(chip, { x, y, label });
	}

	for (const [x, y] of data.anchors) {
		const anchor = new WireAnchor(x, y);
		anchors.add(anchor);
		anchor.addEventListener('remove', () => anchors.delete(anchor));
	}

	for (const { from, to, anchors: wireAnchors } of data.wires) {
		const wire = new Wire(chips.at(from[0]).outputs.at(from[1]));

		for (const i of wireAnchors) {
			const anchor = anchors.at(i);
			wire.anchors.add(anchor);
			anchor.wires.add(wire);
		}
		wire.complete(chips.at(to[0]).inputs.at(to[1]));
		wire.addEventListener('remove', () => wires.delete(wire));
		wires.add(wire);
		element.append(wire);
	}
}

export function serialize(): ChipData {
	const chipArray = chips.toArray(),
		anchorArray = anchors.toArray().filter(a => a.wires.size);
	const name = toolbar.find<HTMLInputElement>('input.name').val() || '';
	const id = toolbar.find<HTMLInputElement>('input.id').val() || name.toLowerCase().replaceAll(/[\W\s]/g, '_');
	const color = toolbar.find<HTMLInputElement>('input.color').val() || randomColor();

	return {
		id,
		name,
		color,
		chips: chipArray.map(chip => chip.toJSON()),
		anchors: anchorArray.map(a => [+a.x.toFixed(), +a.y.toFixed()]),
		wires: wires.toArray().map(wire => {
			const in_chip = wire.input.chip;
			const in_pin = in_chip.outputs.toArray().indexOf(wire.input);

			const out_chip = wire.output!.chip;
			const out_pin = out_chip.inputs.toArray().indexOf(wire.output!);

			return { from: [chipArray.indexOf(in_chip), in_pin], to: [chipArray.indexOf(out_chip), out_pin], anchors: wire.anchors.toArray().map(a => anchorArray.indexOf(a)) };
		}),
	};
}

export function state(): EditorState {
	return { input: inputs().map(input => +input.pin.state as 0 | 1) };
}

toolbar.find<HTMLSelectElement>('button.download').on('click', e => {
	const chip = serialize();

	const chipFile: ChipFile = { version: 0, file: 'chip', chip };

	download((chip.name ?? 'unnamed_chip') + '.json', JSON.stringify(chipFile));
});

toolbar.find('button.reset').on('click', clear);

$('#chip-create').on('click', clear);
