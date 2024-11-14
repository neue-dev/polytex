/**
 * @ Author: Mo David
 * @ Create Time: 2024-11-14 06:55:02
 * @ Modified time: 2024-11-14 09:38:20
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

	// Constants
	const ROOT = './fs';	// Where all files will be stored
	const STATUS = {			// File statuses
		CLOSED: 0,
		STAGED: 1,
		MODIFIED: 2,
	}

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
	 * This function must be used instead of fs.existsSync as it prepends the filename with the ROOT const.
	 * 
	 * @param	filename	The name of the file to check. 
	 * @return					Whether or not the file exists within the location.
	 */
	const file_exists = prepend_root(fs.existsSync)

	/**
	 * A helper function for reading file contents.
	 * This function must be used instead of fs.readFileSync as it prepends the filename with the ROOT const.
	 * 
	 * @param filename	The filename of the file to read. 
	 * @return					The contents of the file.
	 */
	const file_read = prepend_root(fs.readFileSync)

	/**
	 * A helper function for writing file contents.
	 * This function must be used instead of fs.writeFileSync as it prepends the filename with the ROOT const.
	 * 
	 * @param	filename	The filename of the file to write.
	 * @param	content		The content to write.
	 */
	const file_write = prepend_root(fs.writeFileSync)

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
			status: STATUS.CLOSED,
		};
		
		// File methods
		// Rewrite this for performance if it's too bloated... 
		// (every file instance has its own unique copy of the methods...)
		Object.assign(file, {

			// Stages a file unto memory for read/write ops
			// A file can only be staged when it is currently closed
			stage: () => (
				file.status === STATUS.CLOSED && (
					file_exists(filename)
						? file.content = file_read(filename)
						: file_create(filename),
					file.status = STATUS.STAGED),
				file
			),

			// Unstages a file and writes it unto disk
			// If no changes were made, nothing happens
			// A file can only be committed if it is not closed
			commit: () => (
				file.status !== STATUS.CLOSED && (

					// A write only takes place when the file was modified
					file.status === STATUS.MODIFIED && file_write(file.content)
				),
				file
			),

			// Returns the current contents of the file
			// If diffs have been applied, the latest version of the content is returned
			read: () => (
				file.status === STATUS.STAGED 
					? file.content
					: null
			),

			// Edits a file using a diff object
			// This is the only way to modify a file
			edit: (diffs) => (
				// !todo
				file
			),

			// Closes the file and resets its contents
			close: () => (
				file.reset(),
				file.status = STATUS.CLOSED,
				file
			),

			// A helper function that resets the state of the file
			reset: () => (
				file.diffs = [],
				file.content = ''
			)
		})

		return file;
	}

	/**
	 * Returns a new file object with the given filename.
	 * 
	 * @param filename	The name of the file to create. 
	 * @return					The new file object.
	 */
	_.file = (filename) => File(filename)
	
	return {
		..._
	}

})()

export default {
	FS
}