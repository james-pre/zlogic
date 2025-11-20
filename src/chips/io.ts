/* Built-in I/O "chips" */

import { css, html, unsafeCSS, type TemplateResult } from 'lit';
import { Pin } from '../pin.js';
import type { SubChip } from '../static.js';
import { colorState, popup, splitBin } from '../utils.js';
import { Chip, register } from './chip.js';

const ioStyle = (selector: string) =>
	unsafeCSS(`${selector} {
	position: absolute;
	min-width: 2em;
	min-height: 2em;
	aspect-ratio: 1;
	border-radius: 50%;
	transform-origin: center;
	border: 3px solid #555;
}`);

const styles = css`
	:host([dragging]) {
		cursor: grabbing;
	}

	div.connector {
		position: absolute;
		top: calc(50% - 0.125em);
		width: 0.5em;
		height: 0.25em;
		background-color: #666;
	}

	div.connector.input {
		right: -0.5em;
	}

	div.connector.output {
		left: -0.5em;
	}

	.label {
		position: absolute;
		top: -1em;
		height: 1em;
		left: 100%;
		border: none;
		outline: none;
		background: #3333;
		max-width: 10em;
		width: min-content;
	}
`;

function ioLabel(io: Chip) {
	return html` <input
		class="label"
		value="${io.label}"
		@change="${(e: InputEvent & { currentTarget: HTMLInputElement }) => {
			io.label = e.currentTarget.value;
		}}"
	/>`;
}

/**
 * @internal
 */
export class IO extends Chip {
	static styles = [super.styles, styles, ioStyle(':host')];

	public readonly pin: Pin;

	public constructor(public readonly isInput: boolean) {
		super();
		// The pin on an input is actually an output
		this.pin = new Pin(this, !isInput, true);
		this.addEventListener('contextmenu', () => {
			/**
			 * @todo Implement menu
			 */
		});
	}

	public updated(_: Map<PropertyKey, unknown>): void {
		super.updated(_);
		this.style.backgroundColor = colorState(this.pin.state);
	}

	public simUpdate(): void {}

	public render() {
		return html`
			${ioLabel(this)}
			<div class="connector ${this.isInput ? 'input' : 'output'}"></div>
			${this.pin}
		`;
	}
}

@register
export class Input extends IO {
	static builtin = true;
	static display = 'Input Pin';
	static eval = ([a]: boolean[]) => [a];

	public constructor() {
		super(true);
		this.addEventListener(
			'mouseup',
			e => {
				const [actualTarget] = e.composedPath();
				if (actualTarget != this || this.hasMoved || e.button == 1) return;
				this.pin.set(!this.pin.state);
				this.requestUpdate();
			},
			{ capture: true }
		);
	}
}

@register
export class Output extends IO {
	static builtin = true;
	static display = 'Output Pin';
	static eval = ([a]: boolean[]) => [a];

	public constructor() {
		super(false);
	}

	public simUpdate(): void {
		this.requestUpdate();
	}
}

export abstract class IOGroup extends Chip<{ pinCount: number }> {
	static styles = [
		super.styles,
		styles,
		ioStyle('.pin'),
		css`
			:host {
				width: 4em;
			}

			.pins {
				position: absolute;
				inset: 0;
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 1em;
			}

			.display {
				position: absolute;
				top: 0;
				height: 100%;
				width: 3em;

				.line {
					position: absolute;
					border-radius: 0.5em;
					background-color: #aaa;
				}

				.line.top {
					top: 1em;
				}

				.line.bottom {
					bottom: 1em;
				}

				.line.horizontal {
					width: calc(100% - 1em);
					height: 0.5em;
				}

				.line.vertical {
					width: 0.5em;
					height: calc(50% - 4em);
				}

				.value {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					width: 2.5em;
					text-align: center;
					font-size: 0.8em;
					background: transparent;
					border: none;
					outline: none;
				}
			}

			.display.input {
				right: 100%;

				.line.horizontal {
					left: 0.5em;
				}

				.line.vertical {
					left: 0.5em;
				}
			}

			.display.output {
				left: 100%;

				.line.horizontal {
					right: 0.5em;
				}

				.line.vertical {
					right: 0.5em;
				}
			}
		`,
	];

	protected pinGUI: TemplateResult<any>[] = [];

	async setup({ pinCount }: { pinCount?: number } = {}): Promise<void> {
		if (!pinCount) {
			const input = await popup(true, 'Number of pins: <input type="number" min="1" step="1" required />').catch(() => {
				throw 'Cancelled.';
			});
			if (!input) throw 'Please specify number of pins';
			pinCount = parseInt(input);
		}
		if (!Number.isSafeInteger(pinCount)) throw 'Invalid pin count';

		for (let i = 0; i < pinCount; i++) {
			// The pin on an input is actually an output
			new Pin(this, !this.isInput, true);
		}

		this.requestUpdate();
	}

	public constructor(public readonly isInput: boolean) {
		super();
	}

	get value(): number {
		return parseInt(
			this.pins
				.toArray()
				.map(pin => (pin.state ? '1' : '0'))
				.join(''),
			2
		);
	}

	set value(v: number) {
		if (!this.isInput) return;

		v >>>= 0;
		v %= 1 << this.pins.size;

		const state = splitBin(this.pins.size, v);

		for (const pin of this.pins) pin.set(state.pop()!);
	}

	public updated(_: Map<PropertyKey, unknown>): void {
		super.updated(_);
		this.style.height = `${Math.max(2, this.pins.size) * 3}em`;
		for (const [i, pin] of this.pins.entries()) {
			this.shadowRoot!.querySelector<HTMLDivElement>(`.pin[data-i='${i}']`)!.style.backgroundColor = colorState(pin.state);
		}
		if (!this.hasUpdated) this.shadowRoot!.querySelector<HTMLElement>('.value')!.textContent = this.value.toString();
	}

	public simUpdate(): void {}

	protected renderPin(pin: Pin, i: number): TemplateResult<any> {
		const toggle = (event: MouseEvent) => {
			if (!this.isInput || event.button == 1) return;
			pin.set(!pin.state);
			this.requestUpdate();
		};

		return html`<style>
				.pin[data-i='${i}'] {
					top: ${i * 3}em;
				}
			</style>
			<div class="pin" data-i="${i}" @mouseup=${toggle} style="background-color: ${colorState(pin.state)}">
				<div class="connector ${this.isInput ? 'input' : 'output'}"></div>
				${pin}
			</div>`;
	}

	protected _onChange = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
		if (!this.isInput) return;
		this.value = parseInt(e.currentTarget.value);
		this.requestUpdate();
	};

	public render() {
		return html`
			${ioLabel(this)}
			<div class="display ${this.isInput ? 'input' : 'output'}">
				<div class="line top horizontal"></div>
				<div class="line top vertical"></div>
				${this.isInput ? html`<input class="value" value="${this.value}" @change=${this._onChange} />` : html`<span class="value">${this.value}</span>`}
				<div class="line bottom vertical"></div>
				<div class="line bottom horizontal"></div>
			</div>
			<div class="pins">${this.pins.toArray().map((pin, i) => this.renderPin(pin, i))}</div>
		`;
	}

	public toJSON(): SubChip & { pinCount: number } {
		return { ...super.toJSON(), pinCount: this.pins.size };
	}
}

@register
export class InputGroup extends IOGroup {
	static builtin = true;
	static id = 'input_group';
	static display = 'Input Group';
	static eval = (a: boolean[]) => a;
	static color = '#0000';

	public constructor() {
		super(true);
	}
}

@register
export class OutputGroup extends IOGroup {
	static builtin = true;
	static id = 'output_group';
	static display = 'Output Group';
	static eval = (a: boolean[]) => a;
	static color = '#0000';

	public constructor() {
		super(false);
	}

	public simUpdate(): void {
		this.requestUpdate();
	}
}

export const ioKinds = ['input', 'output', 'input_group', 'output_group'];
