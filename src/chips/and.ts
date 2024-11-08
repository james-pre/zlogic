import { Chip } from '../chip.js';
import { Pin } from '../pin.js';

export class AND extends Chip {
	public isBuiltin: boolean = true;

	protected output = new Pin(this, false);

	public constructor(inputs: number) {
		super();

		for (let i = 0; i < inputs; i++) {
			new Pin(this, true);
		}
	}

	public update(): void {
		this.output.set(this.inputs.toArray().every(pin => pin.state));
	}
}
