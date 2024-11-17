/* Static data structures and functions. These are used for serialization */

export interface WireData {
	/**
	 * From sub-chip index, pin no.
	 */
	from: [number, number];
	/**
	 * To sub-chip index, pin no.
	 */
	to: [number, number];

	/**
	 * list of references into the chip's anchors
	 */
	anchors: number[];
}

export interface SubChip {
	kind: string;
	x: number;
	y: number;
}

export interface ChipData {
	id: string;
	name: string;
	color: string;
	chips: SubChip[];
	wires: WireData[];
	anchors: [number, number][];
	code?: string;
}

export interface EditorState {
	input: (0 | 1)[];
}

export interface ProjectFile {
	version: number;
	file: 'project';
	id: string;
	name: string;
	editor: ChipData;
	state: EditorState;
	chips: ChipData[];
}

export interface ChipFile {
	version: number;
	file: 'chip';
	chip: ChipData;
}

export type FileData = ProjectFile | ChipFile;

export const version = 0;

export const chipHeightScaling = 2;
