import $ from 'jquery';
import { randomInt } from 'utilium';

export function randomID(): string {
	return crypto.randomUUID();
}

const popupDialog = $<HTMLDialogElement>('#popup');
export function popup(isPrompt: boolean, contents: string): Promise<string | undefined> {
	const { promise, resolve, reject } = Promise.withResolvers<string | undefined>();

	popupDialog.find('.cancel')[isPrompt ? 'show' : 'hide']();
	popupDialog.find('.contents')[isPrompt ? 'html' : 'text'](contents);

	popupDialog[0].showModal();

	popupDialog.find('button').on('click', e => {
		popupDialog[0].close();
		if (e.target.classList.contains('cancel')) {
			reject();
		} else {
			resolve(popupDialog.find('input').val());
		}
	});

	return promise;
}

export function showError(error: unknown): void {
	const message = error instanceof Error ? error.message : String(error);
	void popup(false, message);
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
export function splitBin(length: number, n: number): boolean[] {
	return [...n.toString(2).slice(0, length).padStart(length, '0')].map(bit => bit == '1');
}

/**
 * Turns an array of true/false into a number
 */
export function unshardN(length: number, values: boolean[]): number {
	return parseInt(
		values
			.map(bit => (bit ? '1' : '0'))
			.join('')
			.slice(0, length),
		2
	);
}

Object.assign(globalThis, { shardN: splitBin, unshardN });
