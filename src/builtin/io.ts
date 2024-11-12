import { css, html } from 'lit';
import { Chip } from '../chip.js';
import { register } from '../component.js';
import { Pin } from '../pin.js';
import { colorState } from '../utils.js';
import { pick } from 'utilium';

/**
 * @internal
 */
export class IO extends Chip {
	static styles = css`
		:host {
			position: absolute;
			cursor: grab;
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
	`;

	public readonly pin: Pin;

	public constructor(isInput: boolean) {
		super();
		this.pin = new Pin(this, isInput, true);
	}

	public updated(_: Map<PropertyKey, unknown>): void {
		super.updated(_);
		this.style.backgroundColor = colorState(this.pin.state);
	}

	public connectedCallback(): void {
		super.connectedCallback();
		this.addEventListener('contextmenu', e => {
			/**
			 * @todo Implement menu
			 */
		});
	}

	public Update(): void {}

	public render() {
		return html`
			<p>${this.name}</p>
			${this.pins.toArray()}
		`;
	}
}

@register
export class Input extends IO {
	public static isBuiltin: boolean = true;
	public static displayName = 'Input Pin';

	public constructor() {
		super(false);
	}

	public connectedCallback(): void {
		this.addEventListener('mouseup', e => {
			if (e.target != this) return;
			if (this.isMoved) return;
			this.pin.set(!this.pin.state);
			this.requestUpdate();
		});
		super.connectedCallback();
	}
}

@register
export class Output extends IO {
	public static isBuiltin: boolean = true;
	public static displayName = 'Output Pin';

	public constructor() {
		super(true);
	}

	public Update(): void {
		this.requestUpdate();
	}
}
