import { Chip } from '../chip.js';
import { register } from '../component.js';
import { Pin } from '../pin.js';

@register
export class AND extends Chip {
	public static isBuiltin: boolean = true;

	protected output = new Pin(this, false);

	public Update(): void {
		this.output.set(this.inputs.toArray().every(pin => pin.state));
	}
}
