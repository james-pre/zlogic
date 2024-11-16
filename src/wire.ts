import { css, html, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Component } from './component.js';
import type { Pin } from './pin.js';
import { colorState } from './utils.js';
import { List } from 'utilium';

@customElement('sim-anchor')
export class WireAnchor extends Component {
	public static styles = [
		Component.styles,
		css`
			:host {
				width: 0;
				height: 0;
				overflow: visible;
				position: absolute;
				transform-origin: center;
				pointer-events: all;
			}

			div {
				min-width: 1em;
				min-height: 1em;
				left: -0.5em;
				top: -0.5em;
				position: relative;
			}
		`,
	];

	public constructor(protected wire: Wire) {
		super({
			canMove: true,
			autoPosition: true,
		});
	}

	public Update(): void {}

	public remove(): void {
		super.remove();
		this.wire.anchors.delete(this);
		this.wire.requestUpdate();
	}

	public updated(_: PropertyValues): void {
		super.updated(_);
		this.wire.requestUpdate();
	}

	public render() {
		return html`<div></div>`;
	}
}

@customElement('sim-wire')
export class Wire extends Component {
	public static styles = css`
		:host {
			position: absolute;
			pointer-events: none;
			width: 100%;
			height: 100%;
			display: contents;
		}

		svg {
			pointer-events: none;
			position: absolute;
			width: 100%;
			height: 100%;
		}

		path {
			fill: none;
			stroke-width: 2;
		}
	`;

	@property() public accessor anchors = new List<WireAnchor>();
	@property() public accessor input: Pin;
	@property() public accessor output: Pin | null = null;

	public constructor(input: Pin) {
		super();
		this.input = input;
		input.wires.add(this);
	}

	public Update(): void {
		this.output?.set(this.input.state);
		this.requestUpdate();
	}

	public remove(): void {
		super.remove();
		this.input.wires.delete(this);
		this.output?.wires.delete(this);
	}

	public addAnchor(x: number, y: number): void {
		const anchor = new WireAnchor(this);
		anchor.x = x;
		anchor.y = y;
		this.anchors.add(anchor);
		this.requestUpdate();
	}

	protected isCompleted: boolean = false;

	public complete(output: Pin): void {
		if (this.isCompleted) {
			return;
		}
		if (this.input == output) {
			return;
		}
		if (output.isInput) {
			// normal
			this.output = output;
		} else {
			// reverse
			this.output = this.input;
			this.input = output;
			this.anchors.toArray().reverse();
		}

		output.wires.add(this);

		this.isCompleted = true;
		this.Update();
	}

	public render() {
		const { x, y } = this.input.offsets();

		let path = `M ${x} ${y}`;

		for (const { x, y } of this.anchors) {
			path += `L ${x} ${y}`;
		}

		if (this.output) {
			const { x, y } = this.output.offsets();
			path += `L ${x} ${y}`;
		}

		return html`<svg xmlns="http://www.w3.org/2000/svg"><path d="${path}" style="stroke:${colorState(this.input.state)}" /></svg>${this.anchors}`;
	}
}
