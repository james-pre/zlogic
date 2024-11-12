import $ from 'jquery';
import { html, LitElement, type CSSResult } from 'lit';
import { property } from 'lit/decorators.js';
import { pick } from 'utilium';
import { randomID } from './utils.js';

export type ComponentStyles = CSSResult | ComponentStyles[];

export interface ComponentJSON {
	id: string;
	x: number;
	y: number;
	name: string;
}

export abstract class Component extends LitElement {
	/**
	 * User-facing name of the component
	 */
	@property() public accessor name = '';

	@property() public accessor x: number = 0;
	@property() public accessor y: number = 0;

	public id: string = randomID();

	/**
	 * Upper case because lit is dumb
	 */
	abstract Update(): void;

	public render() {
		return html`<div></div>`;
	}

	public toJSON(): ComponentJSON {
		return pick(this, 'id', 'x', 'y', 'name');
	}

	public remove(): void {
		super.remove();
		this.dispatchEvent(new Event('removed'));
	}

	// Moving
	private dragging = false;
	private offsetX = 0;
	private offsetY = 0;

	protected canMove: boolean = false;

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
