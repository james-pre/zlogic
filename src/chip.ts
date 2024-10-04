import type { Pin } from './pin.js';

export class Chip {
	public name: string = '';

	public inputs: Set<Pin> = new Set();

	public outputs: Set<Pin> = new Set();

	public constructor(public id: string) {}
}
