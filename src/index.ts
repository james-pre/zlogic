import './styles.css';
import './ui.css';
import $ from 'jquery';
import * as editor from './editor.js';
import './builtin/index.js';

$('#menu button.new').on('click', () => {
	editor.open();
});

$(document.body).on('keydown', e => {
	if (!e.ctrlKey) return;

	switch (e.key) {
		case 'b':
			e.preventDefault();
			$('#menu').animate(
				$('#menu').css('width') == '0px' ? { width: '300px', 'padding-left': '1em', 'padding-right': '1em' } : { width: '0px', 'padding-left': 0, 'padding-right': 0 }
			);
			break;
	}
});
