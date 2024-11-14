/**
 * @ Author: Mo David
 * @ Create Time: 2024-11-14 09:31:53
 * @ Modified time: 2024-11-14 09:58:49
 * @ Description:
 * 
 * Creates an abstraction over the functionalities of the editor on the server side.
 * Creating, modifying, deleting files are all handled here.
 * Changes are queued and batch processed.
 */

import { FS } from "./fs";

export const Editor = (() => {
	
	// Interface
	const _ = {};

	// Active files
	const files = {};

	// Queue of actions to perform
	const commands = [];

	// Interval between command processing
	const interval = 2500;

	/**
	 * A helper function that decorates another function with the capability to auto register files.
	 * By that, we mean that if the file is not found in files, it is automatically given a registration there before we proceed.
	 * 
	 * @param f		The function to decorate. 
	 * @return		The decorated function.
	 */
	const auto_register = (f) => 
		(filename, ...args) => 
			(!files[filename] && (files[filename] = FS.file(filename)), f(filename, ...args))
	
	/**
	 * Creates a new file.
	 * 
	 * @param	filename	The file to create.
	 * @return					The api.
	 */
	const file_create = auto_register((filename) => (files[filename].stage(), _))


	/**
	 * Edits the file with the given diffs.
	 * 
	 * @param	filename	The file to edit.
	 * @param	diffs			The diffs to use for editing.
	 * @return					The api.
	 */
	const file_edit = auto_register((filename, diffs) => (files[filename].edit(diffs), _))

	/**
	 * Removes the file from files.
	 * Files cannot be deleted on the server (except manually).
	 * This is a safety feature.
	 * 
	 * @param	filename	The file to unlist.
	 * @return 					The api.
	 */
	const file_remove = (filename) => (files[filename] && (delete files[filename]))

	/**
	 * The command processor that executes the commands in the queue.
	 */
	setInterval(() => (
		// ! process commands here
		// ! should also automatically perform commits every time a file experiences diffs and the file is not active
		null
	), interval)

	/**
	 * Queues an action to be enacted by the editor.
	 * 
	 * @param	command		The name of the action to queue.
	 * @param	params		The params of the command.
	 * @return 					The api.
	 */
	_.queue = (command, params={}) => (
		// ! todo, create a command object 
		commands.push(command)
	)
	
	return {
		..._
	}

})()

export default {
	Editor
}

