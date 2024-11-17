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
				width: 1em;
				height: 1em;
				top: -0.5em;
				left: -0.5em;
				overflow: visible;
				position: absolute;
				transform-origin: center;
				pointer-events: all;
				z-index: 2;
			}
		`,
	];

	public wires = new List<Wire>();

	public constructor(x: number, y: number) {
		super({
			canMove: true,
			autoPosition: true,
		});

		this.x = x;
		this.y = y;

		this.addEventListener('click', event => {
			event.stopPropagation();
			if (pendingWire) {
				this.wires.add(pendingWire);
				pendingWire.anchors.add(this);
				return;
			}

			const anchors = this.wires.at(0).anchors.toArray();
			const i = anchors.indexOf(this);
			if (i == -1) return; // should not happen

			addPendingWire(this.wires.at(0).input);

			for (const anchor of anchors.slice(0, i + 1)) {
				anchor.wires.add(pendingWire!);
				pendingWire!.anchors.add(anchor);
			}
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
		return html``;
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
			z-index: 1;
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
		for (const anchor of this.anchors) {
			anchor.remove();
		}
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
