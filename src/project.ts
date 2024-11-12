import { popup } from './utils.js';
import { open } from './editor.js';

export async function create() {
	const name = await popup(true, `Project name: <input />`);
	open();
}

export function load() {}
