import $ from 'jquery';

export function randomID(): string {
	return crypto.randomUUID();
}

const alert_ = $<HTMLDialogElement>('#alert');
export function alert(text: string): Promise<void> {
	const { promise, resolve } = Promise.withResolvers<void>();

	alert_.find('p').text(text);

	alert_[0].showModal();

	alert_.find('button').on('click', () => {
		alert_[0].close();
		resolve();
	});

	return promise;
}
