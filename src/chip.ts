import { css, html } from 'lit';
import { List, randomInt } from 'utilium';
import { Component, type ComponentStatic } from './component.js';
import type { Pin } from './pin.js';
import { property } from 'lit/decorators.js';

export abstract class Chip extends Component {
	static randomColor(): string {
		return '#' + randomInt(222, 999);
	}

	static color = this.randomColor();

	static styles = css`
		:host {
			position: absolute;
			cursor: grab;
			min-width: 1em;
			min-height: 1em;
			border-radius: 0.25em;
		}

		:host([dragging]) {
			cursor: grabbing;
		}

		p {
			margin: 1em;
		}
	`;

	public pins = new List<Pin>();

	@property() public accessor color: string = (this.constructor as typeof Chip).color;

	public get inputs(): List<Pin> {
		return new List(this.pins.toArray().filter(pin => pin.isInput));
	}

	public get outputs(): List<Pin> {
		return new List(this.pins.toArray().filter(pin => !pin.isInput));
	}

	protected updated(_: Map<PropertyKey, unknown>): void {
		super.updated(_);
		this.style.transform = `translate(${this.x}px, ${this.y}px)`;
	}

	public simUpdate(): void {
		for (const pin of this.pins) {
			pin.requestUpdate();
		}
	}

	public connectedCallback(): void {
		this.canMove = true;
		super.connectedCallback();
		this.style.backgroundColor = this.color;
	}

	public render() {
		const ctor = this.constructor as typeof Chip & ComponentStatic;

		return html`
			<p>${ctor.displayName || ctor.name}</p>
			${this.pins.toArray()}
		`;
	}
}
