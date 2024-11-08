import { css, html } from 'lit';
import { List, randomHex } from 'utilium';
import { Component } from './component.js';
import type { Pin } from './pin.js';

export abstract class Chip extends Component {
	static styles = [
		Component.styles,
		css`
			:host {
				min-width: 1em;
				min-height: 1em;
			}
		`,
	];

	public pins = new List<Pin>();

	public color: string = '#' + randomHex(6);

	public get inputs(): List<Pin> {
		return new List(this.pins.toArray().filter(pin => pin.isInput));
	}

	public get outputs(): List<Pin> {
		return new List(this.pins.toArray().filter(pin => !pin.isInput));
	}

	protected updated(_: Map<PropertyKey, unknown>): void {
		super.updated(_);
		this.style.backgroundColor = this.color;
	}

	public Update(): void {}

	public render() {
		return html`<div></div>`;
	}
}
