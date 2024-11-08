import { html } from 'lit';
import { List } from 'utilium';
import { Component } from './component.js';
import type { Pin } from './pin.js';
import { customElement } from 'lit/decorators.js';

@customElement('sim-chip')
export class Chip extends Component {
	public pins = new List<Pin>();

	public get inputs(): List<Pin> {
		return new List(this.pins.toArray().filter(pin => pin.isInput));
	}

	public get outputs(): List<Pin> {
		return new List(this.pins.toArray().filter(pin => !pin.isInput));
	}

	public update(): void {}

	public render() {
		return html`<rect width="" />`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'sim-chip': Chip;
	}
}
