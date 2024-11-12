import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Component } from './component.js';
import type { Pin } from './pin.js';

@customElement('sim-anchor')
export class WireAnchor extends Component {
	public simUpdate(): void {}
}

@customElement('sim-wire')
export class Wire extends Component {
	public static styles = css`
		:host {
			position: absolute;
			pointer-events: none;
			width: 100%;
			height: 100%;
		}

		svg {
			width: 100%;
			height: 100%;
		}

		path {
			fill: none;
			stroke-width: 2;
		}
	`;

	@property() public accessor anchors: WireAnchor[] = [];
	@property() public accessor input: Pin;
	@property() public accessor output: Pin | null = null;

	public constructor(input: Pin) {
		super();
		this.input = input;
		input.wires.add(this);
	}

	public simUpdate(): void {
		this.output?.set(this.input.state);
		this.requestUpdate();
	}

	public addAnchor(x: number, y: number): void {
		const anchor = new WireAnchor();
		anchor.x = x;
		anchor.y = y;
		this.anchors.push(anchor);
		this.requestUpdate();
	}

	protected isCompleted: boolean = false;

	public complete(output: Pin): void {
		if (this.isCompleted) {
			return;
		}
		this.output = output;
		output.wires.add(this);
		this.output.set(this.input.state);
		this.isCompleted = true;
		this.requestUpdate();
	}

	/**
	 * @todo Implement
	 */
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

		return html`<svg xmlns="http://www.w3.org/2000/svg"><path d="${path}" style="stroke:${this.input.state ? '#c44' : '#511'}" /></svg>`;
	}
}
