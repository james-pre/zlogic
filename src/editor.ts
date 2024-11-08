import $ from 'jquery';

export const config = {
	max_size: 1000,
};

export let x: number = 0;
export let y: number = 0;
export let scale: number = 1;
export const rotation: number = 0;

export function svgX(): number {
	return x * -scale;
}

export function svgY(): number {
	return y * -scale;
}

export function update(): void {
	$('#editor>g').css({
		translate: `${svgX()}px ${svgY()}px`,
		rotate: rotation + 'rad',
		scale,
	});
}

export function clear(): void {}

$('#editor').on('keydown', e => {
	const speed = e.shiftKey ? 100 : 10,
		max = config.max_size / 2;
	switch (e.key) {
		case 'a':
		case 'ArrowLeft':
			x = Math.max(x - speed, -max);
			break;
		case 'd':
		case 'ArrowRight':
			x = Math.min(x + speed, max);
			break;
		case 'w':
		case 'ArrowUp':
			y = Math.max(y - speed, -max);
			break;
		case 's':
		case 'ArrowDown':
			y = Math.min(y + speed, max);
			break;
	}
	update();
});

$('#editor').on('wheel', ({ originalEvent }: JQuery.TriggeredEvent) => {
	const original = originalEvent as WheelEvent;
	scale = Math.min(Math.max(scale - Math.sign(original.deltaY) * 0.1, 0.5), 5);
	update();
});
