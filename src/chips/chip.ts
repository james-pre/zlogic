import $ from 'jquery';
import { css, html } from 'lit';
import { List } from 'utilium';
import { Component } from '../component.js';
import type { Pin } from '../pin.js';
import { randomColor } from '../utils.js';
import { chipHeightScaling } from '../static.js';

export abstract class Chip extends Component {
	declare ['constructor']: ChipMetadata & ChipLike;

	static styles = [
		Component.styles,
		css`
			:host {
				position: absolute;
				min-width: 1em;
				min-height: 1em;
				border-radius: 0.25em;
			}

			p {
				margin: 1em;
			}
		`,
	];

	public pins = new List<Pin>();

	public get inputs(): List<Pin> {
		return new List(this.pins.toArray().filter(pin => pin.isInput));
	}

	public get outputs(): List<Pin> {
		return new List(this.pins.toArray().filter(pin => !pin.isInput));
	}

	public constructor() {
		super({ canMove: true, autoPosition: true });
	}

	protected updated(_: Map<PropertyKey, unknown>): void {
		super.updated(_);
		this.style.backgroundColor = this.constructor.color || randomColor();

		const { inputs, outputs } = Object.groupBy(this.pins, pin => (pin.isInput ? 'inputs' : 'outputs'));
		const maxOnSide = Math.max(inputs?.length || 0, outputs?.length || 0);
		this.style.minHeight = maxOnSide * chipHeightScaling - 1 + 'em';
		for (const pin of this.pins) {
			pin.requestUpdate();
		}
	}

	public abstract Update(): void;

	public remove(): void {
		super.remove();
		for (const pin of this.pins) {
			pin.remove();
		}
	}

	public render() {
		const ctor = this.constructor;

		return html`
			<p>${ctor.display || ctor.name}</p>
			${this.pins.toArray()}
		`;
	}
}

export interface ChipMetadata {
	id: string;
	display: string;
	builtin: boolean;
	color?: string;
	eval?(inputs: boolean[]): boolean[];
}

export type ChipLike = new () => Chip;

export const chips = new Map<string, ChipLike & ChipMetadata>();

export function register({ id, display, builtin = false, ...rest }: Partial<ChipMetadata>) {
	return function <T extends ChipLike>(target: T): T & ChipMetadata {
		id ||= target.name.toLowerCase();
		display ||= target.name;
		customElements.define('sim-chip-' + Math.random().toString(16).slice(2), target);
		const _ = Object.assign(target, { id, display, builtin, color: randomColor(), ...rest });
		chips.set(id, _);
		$('<option />')
			.val(id)
			.text(display)
			.appendTo('optgroup.' + (builtin ? 'builtin' : 'project'));

		return _;
	};
}
