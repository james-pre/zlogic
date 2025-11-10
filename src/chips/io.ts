/* Built-in I/O "chips" */

import $ from 'jquery';
import { css, html } from 'lit';
import { Pin } from '../pin.js';
import { colorState } from '../utils.js';
import { Chip, register } from './chip.js';

/**
 * @internal
 */
export class IO extends Chip {
	static styles = [
		Chip.styles,
		css`
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
		`,
	];

	public readonly pin: Pin;

	public constructor(isInput: boolean) {
		super();
		this.pin = new Pin(this, isInput, true);
		this.addEventListener('contextmenu', () => {
			/**
			 * @todo Implement menu
			 */
		});
	}

	public updated(_: Map<PropertyKey, unknown>): void {
		super.updated(_);
		this.style.backgroundColor = colorState(this.pin.state);

		$(this.shadowRoot!)
			.find('div.connector')
			.css(this.pin.isInput ? 'left' : 'right', '-0.5em');
	}

	public Update(): void {}

	public render() {
		return html`
			<input
				class="label"
				value="${this.label}"
				@change="${(e: InputEvent & { currentTarget: HTMLInputElement }) => {
					this.label = e.currentTarget.value;
				}}"
			/>
			<div class="connector"></div>
			${this.pins.toArray()}
		`;
	}
}

@register({ builtin: true, display: 'Input Pin', eval: ([a]) => [a] })
export class Input extends IO {
	public constructor() {
		super(false);
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

@register({ builtin: true, display: 'Output Pin', eval: ([a]) => [a] })
export class Output extends IO {
	public constructor() {
		super(true);
	}

	public Update(): void {
		this.requestUpdate();
	}
}
