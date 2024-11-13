import './styles.css';
import './ui.css';
import $ from 'jquery';
import * as project from './project.js';
import { popup } from './utils.js';

$('#menu button.new').on('click', () => {
	void popup(true, 'Project name: <input />').then(project.create).then(project.open);
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
