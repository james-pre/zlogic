/* Built-in logic gates */

import { Chip, register } from './chip.js';
import { Pin } from '../pin.js';

abstract class TwoInput extends Chip {
	public output = new Pin(this, false);
	public a = new Pin(this, true);
	public b = new Pin(this, true);
}

@register({ builtin: true, eval: ([a, b]) => [a || b] })
export class OR extends TwoInput {
	public static color = this.randomColor();

	public Update(): void {
		this.output.set(this.a.state || this.b.state);
	}
}

// Eval trick: https://stackoverflow.com/a/4540443/17637456
@register({ builtin: true, eval: ([a, b]) => [a != b] })
export class XOR extends TwoInput {
	public static color = this.randomColor();

	public Update(): void {
		this.output.set(this.a.state != this.b.state);
	}
}

@register({ builtin: true, eval: ([a, b]) => [a && b] })
export class AND extends TwoInput {
	public static color = this.randomColor();

	public Update(): void {
		this.output.set(this.a.state && this.b.state);
	}
}

@register({ builtin: true, eval: ([a]) => [!a] })
export class NOT extends Chip {
	public static color = this.randomColor();

	public input = new Pin(this, true);
	public output = new Pin(this, false);

	public Update(): void {
		this.output.set(!this.input.state);
	}
}
