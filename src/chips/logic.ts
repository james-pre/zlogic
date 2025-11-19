/* Built-in logic gates */

import { Chip, register } from './chip.js';
import { Pin } from '../pin.js';

/**
 * Helper class since most of the built-in logic gates have two inputs and one output
 */
abstract class TwoInput extends Chip {
	public output = new Pin(this, false);
	public a = new Pin(this, true);
	public b = new Pin(this, true);
}

@register
export class NOT extends Chip {
	static builtin = true;
	static color = '#750';
	static eval = ([a]: boolean[]) => [!a];

	public input = new Pin(this, true);
	public output = new Pin(this, false);

	public Update(): void {
		this.output.set(!this.input.state);
	}
}

@register
export class OR extends TwoInput {
	static builtin = true;
	static color = '#493';
	static eval = ([a, b]: boolean[]) => [a || b];

	public Update(): void {
		this.output.set(this.a.state || this.b.state);
	}
}

// Eval trick: https://stackoverflow.com/a/4540443/17637456
@register
export class XOR extends TwoInput {
	static builtin = true;
	static color = '#397';
	static eval = ([a, b]: boolean[]) => [a != b];

	public Update(): void {
		this.output.set(this.a.state != this.b.state);
	}
}

@register
export class AND extends TwoInput {
	static builtin = true;
	static color = '#236';
	static eval = ([a, b]: boolean[]) => [a && b];

	public Update(): void {
		this.output.set(this.a.state && this.b.state);
	}
}

@register
export class NAND extends TwoInput {
	static builtin = true;
	static color = '#725';
	static eval = ([a, b]: boolean[]) => [!(a && b)];

	public Update(): void {
		this.output.set(!(this.a.state && this.b.state));
	}
}
