import $ from 'jquery';
import { download, upload } from 'utilium/dom.js';
import { register } from './chips/chip.js';
import * as editor from './editor.js';
import { version, type ChipData, type ProjectFile } from './static.js';
import { popup } from './utils.js';
import { CustomChip } from './chips/custom.js';

let currentProject: ProjectFile | null;

export function create(name: string = ''): ProjectFile {
	const project: ProjectFile = {
		file: 'project',
		version,
		id: name.replaceAll(' ', '_'),
		name,
		chips: [],
		editor: { id: '', name: '', chips: [], wires: [] },
		state: { input: [] },
	};

	createUI(project);
	return project;
}

export function open(project: ProjectFile) {
	for (const chip of project.chips) {
		createChip(chip);
	}
	editor.open();
	editor.load(project.editor);
	const inputs = editor.inputs();
	for (let i = 0; i < Math.min(inputs.length, project.state.input.length); i++) {
		inputs[i].pin.set(project.state.input[i] == 1);
	}
	currentProject = project;
	$('#menu .projects').hide();
	$('#menu .chips').show();
}

export function parse(data_str: string | null): ProjectFile {
	if (!data_str) throw 'Project does not exist.';

	let data: Record<string, unknown> | unknown[] | null;
	try {
		data = JSON.parse(data_str) as Record<string, unknown> | unknown[];
	} catch {
		data = null;
	}

	if (!data) throw 'Can not parse project data.';
	if (Array.isArray(data)) throw 'Invalid project data (array)';
	if (data.file != 'project') throw 'Not a project file';
	if (typeof data.version != 'number') throw 'Invalid project version';
	if (data.version > version) throw 'Project version is not supported (too new)';
	data.name ||= 'Unnamed';

	return data as object as ProjectFile;
}

export function createUI(project: ProjectFile): void {
	$('<li />').html(`<p class="name">${project.name}</p>`).appendTo('.projects ul');
}

export function load(id: string) {
	const project_str = localStorage.getItem('project:' + id);

	let data: ProjectFile;
	try {
		data = parse(project_str);
	} catch (message: any) {
		void popup(false, message as string);
		return;
	}

	createUI(data);
	open(data);
}

export function createChip(chip: ChipData) {
	$('<li />')
		.text(chip.name)
		.appendTo('.chips ul')
		.on('click', () => {
			if (!currentProject) return;
			editor.load(currentProject.chips.find(chip => chip.id == chip.id)!);
		});

	@register({
		builtin: false,
		id: chip.id,
		display: chip.name,
	})
	class __CustomChip__ extends CustomChip {
		static data = chip;
	}
}

editor.toolbar.find<HTMLSelectElement>('button.save').on('click', e => {
	if (!currentProject) return;
	const newChip = editor.serialize();
	const i = currentProject.chips.findIndex(chip => chip.id == newChip.id);
	if (i == -1) {
		createChip(newChip);
		currentProject.chips.push(newChip);
	} else {
		currentProject.chips.splice(i, 1, newChip);
	}
});

$('#project-upload').on('click', () => {
	void upload('json', false)
		.then(file => file.text())
		.then(parse)
		.then(project => {
			createUI(project);
			open(project);
		});
});

$('#project-download').on('click', () => {
	if (!currentProject) return;
	currentProject.editor = editor.serialize();
	currentProject.state = editor.state();
	download(JSON.stringify(currentProject), currentProject.id + '.json');
});
