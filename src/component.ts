import $ from 'jquery';
import { css, LitElement, type CSSResult } from 'lit';
import { property } from 'lit/decorators.js';
import { randomID } from './utils.js';

type Styles = CSSResult | Styles[];

export abstract class Component extends LitElement {
	static styles: Styles = css`
		:host {
			position: absolute;
			cursor: grab;
		}

		:host([dragging]) {
			cursor: grabbing;
		}
	`;

	/**
	 * User-facing name of the component
	 */
	@property() public accessor name = '';

	@property() public accessor x: number = 0;
	@property() public accessor y: number = 0;

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

	protected updated(_: Map<PropertyKey, unknown>): void {
		super.updated(_);
		this.style.position = 'absolute';
		this.style.transform = `translate(${this.x}px, ${this.y}px)`;
	}

	public id: string = randomID();

	/**
	 * Upper case because lit is dumb
	 */
	abstract Update(): void;
}

export interface ComponentStatic {
	displayName?: boolean;
	isBuiltin?: boolean;
}

export type ComponentLike = ComponentStatic & (new () => Component);

export const components = new Map<string, ComponentLike>();

export function register(target: ComponentLike) {
	customElements.define('sim-' + target.name.toLowerCase(), target);
	components.set(target.name, target);
	$('<option />')
		.text(target.displayName || target.name)
		.appendTo('optgroup.' + (target.isBuiltin ? 'builtin' : 'project'));
}
