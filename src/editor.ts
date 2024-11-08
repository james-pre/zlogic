import $ from 'jquery';
import { components } from './component.js';
import { alert } from './utils.js';

export const element = $('#editor'),
	container = $('#editor-container');

export function clear(): void {}

export function open(): void {
	$('#menu').hide();
	container.show();
}

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
