import { Chip } from '../chip.js';
import { register } from '../component.js';
import { Pin } from '../pin.js';

@register
export class Bus extends Chip {
	public isBuiltin: boolean = true;

	public constructor(inputs: number) {
		super();

		for (let i = 0; i < inputs; i++) {
			new Pin(this, true);
			new Pin(this, false);
		}
	}

	public update(): void {
		const { inputs, outputs } = this;

		for (let i = 0; i < inputs.size; i++) {
			outputs.at(i).set(inputs.at(i).state);
		}
	}
}
