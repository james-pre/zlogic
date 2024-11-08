import './styles.css';
import './ui.css';
import $ from 'jquery';
import * as editor from './editor.js';
import './builtin/index.js';

$('#menu button.new').on('click', () => {
	editor.open();
});
