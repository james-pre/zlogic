import { EventEmitter } from 'eventemitter3';

export type PinState = 'low' | 'high' | 'floating';

export class Pin extends EventEmitter {
	public state: PinState = 'floating';

	public kind: 'input' | 'output' | 'built-in' | '' = '';

	public constructor(
		public name: string,
		public id: number
	) {
		super();
	}
}
