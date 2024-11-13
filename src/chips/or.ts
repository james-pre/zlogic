import { Chip, register } from './chip.js';
import { Pin } from '../pin.js';

@register({ builtin: true, eval: ([a, b]) => [a || b] })
export class OR extends Chip {
	public static color = this.randomColor();

	protected output = new Pin(this, false);

	public constructor() {
		super();
		new Pin(this, true);
		new Pin(this, true);
	}

	public Update(): void {
		this.output.set(this.inputs.toArray().some(pin => pin.state));
	}
}
