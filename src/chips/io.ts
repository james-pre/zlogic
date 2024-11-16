/* Built-in I/O "chips" */

import { css, html } from 'lit';
import { Chip, register } from './chip.js';
import { Pin } from '../pin.js';
import { colorState } from '../utils.js';
import $ from 'jquery';

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
			<p>${this.name}</p>
			<div class="connector"></div>
			${this.pins.toArray()}
		`;
	}
}

@register({ builtin: true, display: 'Input Pin', eval: ([a]) => [a] })
export class Input extends IO {
	public constructor() {
		super(false);
		this.addEventListener('mouseup', e => {
			if (e.target != this || this.isMoved || e.button == 1) return;
			this.pin.set(!this.pin.state);
			this.requestUpdate();
		});
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
