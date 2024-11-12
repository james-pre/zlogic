import $ from 'jquery';
import { Chip } from './chip.js';
import { components } from './component.js';
import type { Pin } from './pin.js';
import { alert } from './utils.js';
import { Wire } from './wire.js';

export const element = $('#editor'),
	container = $('#editor-container');

export function clear(): void {}

export function open(): void {
	$('#menu').hide();
	container.show();
}

export const { left: x, top: y } = element.offset()!;

container.find<HTMLSelectElement>('select.add').on('change', e => {
	if (!e.target.value) {
		return;
	}

	const Part = components.get(e.target.value);
	if (!Part) {
		void alert('Component does not exist');
		return;
	}

	const part = new Part();
	element.append(part);
	e.target.value = '';
});

let pendingWire: Wire | null;

export function connectWire(pin: Pin) {
	if (pendingWire) {
		pendingWire.complete(pin);
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
