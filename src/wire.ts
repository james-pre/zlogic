import $ from 'jquery';
import { css, html, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { List } from 'utilium';
import { Component, eventPosition } from './component.js';
import type { Pin } from './pin.js';
import { colorState } from './utils.js';

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

	public wires = new Set<Wire>();

	public constructor(x: number, y: number) {
		super({
			canMove: true,
			autoPosition: true,
		});

		this.x = x;
		this.y = y;

		this.addEventListener('click', e => {
			e.stopPropagation();
		});
	}

	public Update(): void {}

	public remove(): void {
		super.remove();
		for (const wire of this.wires) {
			wire.anchors.delete(this);
		}
		this.requestUpdate();
	}

	public updated(_: PropertyValues): void {
		super.updated(_);
		for (const wire of this.wires) {
			wire.requestUpdate();
		}
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

		line {
			pointer-events: stroke;
			fill: none;
			stroke-width: 5;
			stroke-linecap: round;
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
		const anchor = new WireAnchor(x, y);
		anchor.wires.add(this);
		this.anchors.add(anchor);
		this.requestUpdate();
	}

	protected isCompleted: boolean = false;

	public lastItem(): WireAnchor | Pin {
		return this.anchors.size ? this.anchors.at(-1) : this.input;
	}

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
		const parts = [this.input.offsets(), ...this.anchors, this.output ? this.output.offsets() : null];

		const paths: SVGLineElement[] = [];

		for (let i = 1; i < parts.length; i++) {
			const start = parts[i - 1],
				end = parts[i];
			if (!start || !end) continue;

			const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');

			$(line).attr({
				stroke: colorState(this.input.state),
				x1: start.x,
				y1: start.y,
				x2: end.x,
				y2: end.y,
			});

			line.addEventListener('click', event => {
				if (event.button != 0) return;
				const { x, y } = eventPosition(event);
				console.log('clicked segment', i - 1, { x, y });
			});
			paths.push(line);
		}

		return html`<svg xmlns="http://www.w3.org/2000/svg">${paths}</svg>${this.anchors}`;
	}
}

export let pendingWire: Wire | null;

/**
 * Creates a new pending wire if one does not already exist.
 * @returns if a wire was created
 */
export function addPendingWire(pin: Pin): boolean {
	if (pendingWire) return false;
	pendingWire = new Wire(pin);
	$('#editor').append(pendingWire);
	return true;
}

export function removePendingWire() {
	pendingWire = null;
}
