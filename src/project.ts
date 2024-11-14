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
		editor: { id: '', name: '', chips: [], wires: [], color: '' },
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

export function close() {
	editor.close();
	$('#menu .projects').show();
	$('#menu .chips').hide();
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
	$('<li />')
		.attr('id', prefix + project.id)
		.html(`<p class="name">${project.name}</p>`)
		.appendTo('.projects ul')
		.on('click', () => {
			open(project);
		});
}

export function load(id: string) {
	if (!id.startsWith(prefix)) id = prefix + id;
	const project_str = localStorage.getItem(id);

	let data: ProjectFile;
	try {
		data = parse(project_str);
	} catch (message: any) {
		void popup(false, message as string);
		return;
	}

	createUI(data);
}

export function createChip(chip: ChipData) {
	$('<li />')
		.text(chip.name)
		.appendTo('.chips ul')
		.on('click', () => {
			if (!currentProject) return;
			editor.load(currentProject.chips.find(({ id }) => id == chip.id)!);
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

const prefix = 'project~';

export function save() {
	if (!currentProject) return;
	const newChip = editor.serialize();
	const i = currentProject.chips.findIndex(chip => chip.id == newChip.id);
	if (i == -1) {
		createChip(newChip);
		currentProject.chips.push(newChip);
	} else {
		currentProject.chips.splice(i, 1, newChip);
	}
	localStorage.setItem(prefix + currentProject.id, JSON.stringify(currentProject));
}

editor.toolbar.find<HTMLSelectElement>('button.save').on('click', save);

$('#project-upload').on('click', () => {
	void upload('json', false)
		.then(file => file.text())
		.then(parse)
		.then(project => {
			createUI(project);
			open(project);
			localStorage.setItem(prefix + project.id, JSON.stringify(project));
		});
});

$('#project-download').on('click', () => {
	if (!currentProject) return;
	currentProject.editor = editor.serialize();
	currentProject.state = editor.state();
	download(JSON.stringify(currentProject), currentProject.id + '.json');
});

$('#project-delete').on('click', () => {
	if (!currentProject) return;
	void popup(true, 'Are you sure?')
		.then(() => {
			const { id } = currentProject!;
			localStorage.removeItem(prefix + id);
			$('#' + prefix + id).remove();
			close();
			currentProject = null;
		})
		.catch(e => {
			if (e) {
				console.error(e);
			}
		});
});

for (let i = 0; i < localStorage.length; i++) {
	const key = localStorage.key(i);
	if (key?.startsWith(prefix)) {
		load(key);
	}
}
