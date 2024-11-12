import { Chip } from '../chip.js';
import { register } from '../component.js';
import { Pin } from '../pin.js';

@register
export class OR extends Chip {
	public static isBuiltin: boolean = true;
	public static color = this.randomColor();

	public constructor() {
		super();
		new Pin(this, true);
		new Pin(this, true);
	}

	protected output = new Pin(this, false);

	public simUpdate(): void {
		this.output.set(this.inputs.toArray().some(pin => pin.state));
	}
}
