/* Built-in I/O "chips" */

import $ from 'jquery';
import { css, html, type TemplateResult } from 'lit';
import { Pin } from '../pin.js';
import { colorState } from '../utils.js';
import { Chip, register } from './chip.js';

const ioPinStyles = css`
	:host {
		position: absolute;
		min-width: 2em;
		min-height: 2em;
		aspect-ratio: 1;
		border-radius: 50%;
		transform-origin: center;
		border: 3px solid #555;
	}

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
`;

const ioLabelStyles = css`
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
	static styles = [super.styles, ioPinStyles, ioLabelStyles];

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

	public Update(): void {}

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

	public Update(): void {
		this.requestUpdate();
	}
}
