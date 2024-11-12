import $ from 'jquery';
import { open as openEditor } from './editor.js';
import { popup } from './utils.js';
import { version, type ProjectFile } from './static.js';

export async function create(): Promise<void> {
	const name = await popup(true, 'Project name: <input />');
	open();
}

export function open() {
	openEditor();
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

declare function createUI(project: ProjectFile): void;

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
}
