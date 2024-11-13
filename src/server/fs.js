/**
 * @ Author: Mo David
 * @ Create Time: 2024-11-14 06:55:02
 * @ Modified time: 2024-11-14 07:40:55
 * @ Description:
 * 
 * A rudimentary abstraction over the file system.
 * Helps us read and write files to the drive.
 */

import fs from 'fs'
import path from 'path'

import { DMP } from './diff-match-patch.js'

export const FS = (() => {

	// Interface
	const _ = {};

	// Where all files will be stored
	const ROOT = './fs';

	/**
	 * Helper function for creating a new file and the approriate subdirectories.
	 * Note that filenames are automatically prefixed by the ROOT const.
	 * 
	 * @param filename	The name of the file to create. 
	 */
	const new_file = (filename) => (
		((path_str) => 
			((path_spec) => (

				// Check if folder and file exists
				!fs.existsSync(path_spec.dir) && fs.mkdirSync(path_spec.dir, { recursive: true }),
				!fs.existsSync(path_str) && fs.writeFileSync(path_str, '')

			// The path object
			))(path.parse(path_str))
		
		// The full relative path of the file
		)(path.join(ROOT, filename))
	)

	/**
	 * The file class.
	 * A file can either be in memory or on the disk.
	 * This allows us to defer read and write ops to when we know the file has become stable.
	 * Read and write operations can only be performed when a file is staged unto memory.
	 */
	const File = (filename) => {

		// Create the file
		const file = {
			diffs: [],
			content: '',
		};
		
		// File methods
		file.prototype = {};
		Object.assign(file.prototype, {

			// Stages a file unto memory for read/write ops
			stage: () => (
				fs.existsSync(filename)
					? file.content = fs.readFileSync(filename)
					: null // ! edit create filehere
			),

			// Unstages a file and writes it unto disk
			// If no changes were made, nothing happens
			commit: () => (
				null
			),

			// Reads a file and returns its contents
			read: () => (
				null
			),

			// Edits a file using a diff object
			// This is the only way to modify a file without overwriting it
			edit: (diffs) => (
				null
			),

			// Overwrites the existing contents of a file
			write: () => (
				null	
			)
		})

		return file;
	}
	
	return {
		..._
	}

})()

export default {
	FS
}