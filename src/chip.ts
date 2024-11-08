import { css } from 'lit';
import { List, randomHex } from 'utilium';
import { Component } from './component.js';
import type { Pin } from './pin.js';

export abstract class Chip extends Component {
	static styles = css`
		:host {
			position: absolute;
			cursor: grab;
			min-width: 1em;
			min-height: 1em;
		}

		:host([dragging]) {
			cursor: grabbing;
		}
	`;

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

	private dragging = false;
	private offsetX = 0;
	private offsetY = 0;

	protected canMove: boolean = true;

	private onMouseDown = (event: MouseEvent) => {
		this.dragging = true;
		this.offsetX = event.clientX - this.x;
		this.offsetY = event.clientY - this.y;
		this.setAttribute('dragging', '');
		document.addEventListener('mousemove', this.onMouseMove);
		document.addEventListener('mouseup', this.onMouseUp);
	};

	private onMouseMove = (event: MouseEvent) => {
		if (!this.dragging) return;

		this.x = event.clientX - this.offsetX;
		this.y = event.clientY - this.offsetY;
		this.style.transform = `translate(${this.x}px, ${this.y}px)`;
	};

	private onMouseUp = () => {
		if (!this.dragging) return;

		this.dragging = false;
		this.removeAttribute('dragging');
	};

	public connectedCallback() {
		super.connectedCallback();
		this.classList.add('component');
		if (!this.canMove) return;
		this.addEventListener('mousedown', this.onMouseDown);
		this.addEventListener('mousemove', this.onMouseMove);
		this.addEventListener('mouseup', this.onMouseUp);
	}

	public disconnectedCallback() {
		super.disconnectedCallback();
		if (!this.canMove) return;
		this.removeEventListener('mousedown', this.onMouseDown);
		this.removeEventListener('mousemove', this.onMouseMove);
		this.removeEventListener('mouseup', this.onMouseUp);
	}
}
