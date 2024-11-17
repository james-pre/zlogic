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

	/**
	 * Tracks information while moving
	 */
	private move?: {
		pastX: number;
		pastY: number;
		offX: number;
		offY: number;
		lockedAxis?: 'x' | 'y';
	};
	protected hasMoved: boolean = false;

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

		this.addEventListener('mousedown', event => {
			if (!this.options.bubbleMouse) event.stopPropagation();
			if (!this.options.canMove || event.button != 0) return;
			this.move = {
				pastX: this.x,
				pastY: this.y,
				offX: event.clientX - this.x,
				offY: event.clientY - this.y,
			};

			this.setAttribute('dragging', '');
			document.addEventListener('mousemove', this.onMouseMove);
			document.addEventListener('mouseup', this.onMouseUp);
		});
		document.addEventListener('keydown', this.onKeyDown);
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

	protected stopMove(resetPosition: boolean) {
		if (!this.options.canMove || !this.move) return;

		if (resetPosition) {
			this.x = this.move.pastX;
			this.y = this.move.pastY;
		}

		this.move = undefined;
		this.hasMoved = false;
		this.removeAttribute('dragging');
		document.removeEventListener('mousemove', this.onMouseMove);
		document.removeEventListener('mouseup', this.onMouseUp);
	}

	protected moveTo(x: number, y: number) {
		if (!this.options.canMove || !this.move) return;

		const newX = this.move.lockedAxis == 'y' ? this.move.pastX : x;
		const newY = this.move.lockedAxis == 'x' ? this.move.pastY : y;

		this.hasMoved ||= newX != this.x || newY != this.y;
		this.x = newX;
		this.y = newY;
	}

	private onKeyDown = ({ key }: KeyboardEvent) => {
		if (!this.move) return;

		const { move } = this;

		if (key == 'x' || key == 'y') {
			move.lockedAxis = key != move.lockedAxis ? key : undefined;
			if (move.lockedAxis) this.moveTo(this.x, this.y);
		}

		if (key == 'Escape') this.stopMove(true);
	};

	private onMouseMove = (event: MouseEvent) => {
		if (!this.options.bubbleMouse) event.stopPropagation();
		if (!this.move) return;
		this.moveTo(event.clientX - this.move.offX, event.clientY - this.move.offY);
	};

	private onMouseUp = (event: MouseEvent) => {
		if (!this.options.bubbleMouse) event.stopPropagation();
		this.stopMove(false);
	};

	public disconnectedCallback() {
		super.disconnectedCallback();
		document.removeEventListener('mousemove', this.onMouseMove);
		document.removeEventListener('mouseup', this.onMouseUp);
		document.removeEventListener('keydown', this.onKeyDown);
	}
}
