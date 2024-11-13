/**
 * @ Author: Mo David
 * @ Create Time: 2024-11-14 06:55:02
 * @ Modified time: 2024-11-14 07:50:06
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
	 * Helper function that wraps a function so the root name is prepended to the filename.
	 * 
	 * @param f		The function to decorate. 
	 * @return		A decorated function that prepends the ROOT to the filename.
	 */
	const prepend_root = (f) => (filename, ...args) => f(path.join(ROOT, filename), ...args)

	/**
	 * Helper function for creating a new file and the approriate subdirectories.
	 * Note that filenames are automatically prefixed by the ROOT const.
	 * 
	 * @param filename	The name of the file to create. 
	 */
	const file_create = prepend_root((filename) => (
		((path_spec) => (

			// Check if folder and file exists
			!fs.existsSync(path_spec.dir) && fs.mkdirSync(path_spec.dir, { recursive: true }),
			!fs.existsSync(filename) && fs.writeFileSync(filename, '')

		// The path object
		))(path.parse(filename))
	))

	/**
	 * A helper function for checking if a file exists.
	 * This file must be used instead of fs.existsSync as it prepends the filename with the ROOT const.
	 * 
	 * @param	filename	The name of the file to check. 
	 * @return					Whether or not the file exists within the location.
	 */
	const file_exists = prepend_root((filename) => fs.existsSync(filename))

	/**
	 * A helper function for reading file contents.
	 * This file must be used instead of fs.existsSync as it prepends the filename with the ROOT const.
	 * 
	 * @param filename	The filename of the file to read. 
	 * @return					The contents of the file.
	 */
	const file_read = prepend_root((filename) => fs.readFileSync(filename))

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
				file_exists(filename)
					? file.content = file_read(filename)
					: file_create(filename)
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