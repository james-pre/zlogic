/* Built-in I/O "chips" */

import { css, html, type TemplateResult } from 'lit';
import { Pin } from '../pin.js';
import type { SubChip } from '../static.js';
import { colorState, popup, splitBin } from '../utils.js';
import { Chip, register } from './chip.js';

const ioStyles = css`
	:host([dragging]) {
		cursor: grabbing;
	}

	.io {
		position: absolute;
		min-width: 2em;
		min-height: 2em;
		aspect-ratio: 1;
		border-radius: 50%;
		transform-origin: center;
		border: 3px solid #555;
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

function ioPin(io: IO | IOGroup, pin: Pin) {
	const div = io.isInput ? html`<div class="io" @mouseup=${{ handleEvent: () => toggleInput(io, pin), capture: true }}></div>` : html`<div class="io"></div>`;

	return html`
		${div}
		<div class="connector ${io.isInput ? 'output' : 'output'}"></div>
		${pin}
	`;
}

function toggleInput(this: void, chip: Chip, pin: Pin) {
	return function (event: MouseEvent) {
		const [actualTarget] = event.composedPath();
		if (chip.hasMoved || event.button == 1) return;
		pin.set(!pin.state);
		chip.requestUpdate();
	};
}

/**
 * @internal
 */
export class IO extends Chip {
	static styles = [super.styles, ioStyles];

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
		return html`${ioLabel(this)} ${ioPin(this, this.pin)}`;
	}
}

@register
export class Input extends IO {
	static builtin = true;
	static display = 'Input Pin';
	static eval = ([a]: boolean[]) => [a];

	public constructor() {
		super(true);
		this.addEventListener('mouseup', toggleInput(this, this.pin), { capture: true });
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
		ioStyles,
		css`
			.display {
				position: absolute;
				top: 0;
				height: 100%;
				width: 3em;

				svg.bracket {
					position: absolute;
					inset: 0;
					width: 100%;
					height: 100%;

					path {
						stroke: #aaa;
						stroke-width: 4;
						fill: none;
						stroke-linejoin: round;
					}
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
			}

			.display.output {
				left: 100%;
			}
		`,
	];

	async setup({ pinCount }: { pinCount: number }): Promise<void> {
		if (!pinCount) {
			const input = await popup(true, 'Number of pins: <input type="number" min="1" step="1" required />');
			if (!input) throw 'Please specify number of pins';
			pinCount = parseInt(input);
		}
		if (!Number.isSafeInteger(pinCount)) throw 'Invalid pin count';

		for (let i = 0; i < pinCount; i++) {
			// The pin on an input is actually an output
			new Pin(this, !this.isInput, true);
		}
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

	public updated(_: Map<PropertyKey, unknown>): void {
		super.updated(_);
	}

	public simUpdate(): void {}

	protected abstract renderDisplay(): TemplateResult<any>;

	public render() {
		return html`
			${ioLabel(this)}
			<div class="display ${this.isInput ? 'input' : 'output'}">${this.renderDisplay()}</div>
			${this.pins.toArray().map(pin => ioPin(this, pin))}
		`;
	}

	public toJSON(): SubChip & { pinCount: number } {
		return {
			...super.toJSON(),
			pinCount: this.pins.size,
		};
	}
}

@register
export class InputGroup extends IOGroup {
	static builtin = true;
	static display = 'Input Group';
	static eval = (a: boolean[]) => a;

	public constructor() {
		super(true);
	}

	set value(v: number) {
		v >>>= 0;
		v %= 1 << this.pins.size;

		const state = splitBin(this.pins.size, v);

		for (const pin of this.pins) pin.set(state.pop()!);
	}

	protected renderDisplay(): TemplateResult<any> {
		return html`
			<svg class="bracket" viewBox="0 0 10 100" preserveAspectRatio="none">
				<path d="M 10 0 H 2 V 30 M 2 70 V 100 H 10" />
			</svg>
			<input class="value" value="${this.value}" />
		`;
	}
}

@register
export class OutputGroup extends IOGroup {
	static builtin = true;
	static display = 'Output Group';
	static eval = (a: boolean[]) => a;

	public constructor() {
		super(false);
	}

	protected renderDisplay(): TemplateResult<any> {
		return html`
			<svg class="bracket" viewBox="0 0 10 100" preserveAspectRatio="none">
				<path d="M 0 0 H 8 V 30 M 8 70 V 100 H 0" />
			</svg>
			<span class="value">${this.value}</span>
		`;
	}
}
