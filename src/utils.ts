import $ from 'jquery';
import { randomInt } from 'utilium';

export function randomID(): string {
	return crypto.randomUUID();
}

const popup_ = $<HTMLDialogElement>('#popup');
export function popup(isPrompt: boolean, contents: string): Promise<string | undefined> {
	const { promise, resolve, reject } = Promise.withResolvers<string | undefined>();

	popup_.find('.cancel')[isPrompt ? 'show' : 'hide']();
	popup_.find('.contents')[isPrompt ? 'html' : 'text'](contents);

	popup_[0].showModal();

	popup_.find('button').on('click', e => {
		popup_[0].close();
		if (e.target.classList.contains('cancel')) {
			reject();
		} else {
			resolve(popup_.find('input').val());
		}
	});

	return promise;
}

export function colorState(state: boolean): string {
	return state ? '#c44' : '#511';
}

export function randomColor(): string {
	return '#' + randomInt(444, 999).toString().replace(/./g, '$&$&');
}

/**
 * Splits up a number into an array of true/false
 */
export function shardN(n: number, length: number): boolean[] {
	return [...n.toString(2).slice(0, length).padStart(length, '0')].map(bit => bit == '1');
}

/**
 * Turns an array of true/false into a number
 */
export function unshardN(values: boolean[], length: number): number {
	return parseInt(
		values
			.map(bit => (bit ? '1' : '0'))
			.join('')
			.slice(0, length),
		2
	);
}

Object.assign(globalThis, { shardN, unshardN });
