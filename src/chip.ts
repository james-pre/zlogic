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
		this.style.backgroundColor = this.color;
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

	public render() {
		const ctor = this.constructor as typeof Chip & ComponentStatic;

		return html`
			<p>${ctor.displayName || ctor.name}</p>
			${this.pins.toArray()}
		`;
	}
}
