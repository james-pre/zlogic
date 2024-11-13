import { Chip, register } from '../chip.js';
import { Pin } from '../pin.js';

@register({ builtin: true, eval: ([a]) => [!a] })
export class NOT extends Chip {
	public static color = this.randomColor();

	public input = new Pin(this, true);
	public output = new Pin(this, false);

	public Update(): void {
		this.output.set(!this.input.state);
	}
}
