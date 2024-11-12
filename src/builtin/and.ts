import { Chip, register } from '../chip.js';
import { Pin } from '../pin.js';

@register({ builtin: true })
export class AND extends Chip {
	public static color = this.randomColor();

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
