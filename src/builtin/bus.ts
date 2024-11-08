import { Chip } from '../chip.js';
import { register } from '../component.js';
import { Pin } from '../pin.js';

@register
export class Bus extends Chip {
	public static isBuiltin: boolean = true;
	public static color = this.randomColor();

	public input = new Pin(this, true);
	public output = new Pin(this, false);

	public Update(): void {
		this.output.set(this.input.state);
	}
}
