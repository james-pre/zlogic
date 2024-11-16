import { css, LitElement, type CSSResult, type CSSResultGroup, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { randomID } from './utils.js';
import $ from 'jquery';
import { resolveConstructors } from 'utilium';

export type ComponentStyles = CSSResult | ComponentStyles[];

export function eventPosition(event: MouseEvent): { x: number; y: number } {
	const { left, top } = $('#editor').offset()!;

	return {
		x: event.clientX - left,
		y: event.clientY - top,
	};
}

export abstract class Component extends LitElement {
	public static styles: CSSResultGroup = css`
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

	public id: string = randomID();

	// Moving
	private dragging = false;
	private offsetX = 0;
	private offsetY = 0;
	protected isMoved: boolean = false;

	public constructor(
		protected options: {
			canMove?: boolean;
			autoPosition?: boolean;
			bubbleMouse?: boolean;
		} = {}
	) {
		super();
		this.classList.add('component');
		this.addEventListener('auxclick', (e: MouseEvent) => {
			if (e.button == 1) {
				e.stopPropagation();
				this.remove();
			}
		});

		this.addEventListener('mousedown', (event: MouseEvent) => {
			if (!this.options.bubbleMouse) event.stopPropagation();
			if (!this.options.canMove || event.button != 0) return;
			this.dragging = true;
			this.offsetX = event.clientX - this.x;
			this.offsetY = event.clientY - this.y;
			this.setAttribute('dragging', '');
			document.addEventListener('mousemove', this.onMouseMove);
			document.addEventListener('mouseup', this.onMouseUp);
		});
		this.addEventListener('mousemove', this.onMouseMove);
		this.addEventListener('mouseup', this.onMouseUp);
	}

	public isKind<T extends Component>(kind: string): this is T {
		return resolveConstructors(this).includes(kind);
	}

	/**
	 * Upper case because lit is dumb
	 */
	abstract Update(): void;

	protected updated(_: PropertyValues): void {
		super.updated(_);

		if (this.options.autoPosition) this.style.transform = `translate(${this.x}px, ${this.y}px)`;
	}

	public remove(): void {
		super.remove();
		this.dispatchEvent(new Event('remove'));
	}

	private onMouseMove = (event: MouseEvent) => {
		if (!this.options.bubbleMouse) event.stopPropagation();
		if (!this.options.canMove || !this.dragging) return;

		const newX = event.clientX - this.offsetX;
		const newY = event.clientY - this.offsetY;
		this.isMoved ||= newX != this.x || newY != this.y;
		this.x = newX;
		this.y = newY;
	};

	private onMouseUp = (event: MouseEvent) => {
		if (!this.options.bubbleMouse) event.stopPropagation();
		if (!this.options.canMove || !this.dragging) return;

		this.dragging = false;
		this.isMoved = false;
		this.removeAttribute('dragging');
		document.removeEventListener('mousemove', this.onMouseMove);
		document.removeEventListener('mouseup', this.onMouseUp);
	};

	public disconnectedCallback() {
		super.disconnectedCallback();
		document.removeEventListener('mousemove', this.onMouseMove);
		document.removeEventListener('mouseup', this.onMouseUp);
	}
}
