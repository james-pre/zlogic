import { Chip, register } from '../chip.js';
import { Pin } from '../pin.js';

@register({ builtin: true, eval: ([a, b]) => [a || b] })
export class OR extends Chip {
	public static color = this.randomColor();

	public constructor() {
		super();
		new Pin(this, true);
		new Pin(this, true);
	}

	protected output = new Pin(this, false);

	public Update(): void {
		this.output.set(this.inputs.toArray().some(pin => pin.state));
	}
}
