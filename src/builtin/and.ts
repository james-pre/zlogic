import { Chip } from '../chip.js';
import { register } from '../component.js';
import { Pin } from '../pin.js';

@register
export class AND extends Chip {
	public static isBuiltin: boolean = true;

	public constructor() {
		super();
		new Pin(this, true);
		new Pin(this, true);
	}

	protected output = new Pin(this, false);

	public Update(): void {
		this.output.set(this.inputs.toArray().every(pin => pin.state));
	}
}
