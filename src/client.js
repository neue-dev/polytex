/**
 * @ Author: Mo David
 * @ Create Time: 2024-11-13 12:54:56
 * @ Modified time: 2024-11-13 13:35:48
 * @ Description:
 * 
 * Main client side file.
 */

/**
 * The client side of the app.
 */
const PolyTeXClient = (() => {
	
	// Set the worker source manually (kinda sad it has to be manual)
	pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';

	// Interface
	const _ = {};

	// Editor, viewer, and renderer
	const editor = {};
	const viewer = {};
	const renderer = new PdfTeXEngine();

	/**
	 * Initializes the client.
	 * Extends the editor to give it more API-friendly functionality.
	 */
	_.init = () => {
		
		// Grab the correspnding DOM elements
		editor.element = document.getElementById('editor');
		viewer.element = document.getElementById('viewer');

		// The model provided by the ace library
		editor.model = ace.edit(editor.element, {
			mode: 'ace/mode/latex',
			theme: 'ace/theme/ambiance',
		})

		// Extend the editor interface
		Object.assign(editor, {

			// Get-setter for the content of the editor
			value: (value) => (
				value !== undefined	
					?	(editor.model.setValue(value), editor)
					: (editor.model.getValue())
			),

			// Get-setter for options
			option: (option, value) => (
				value !== undefined
					? (editor.model.setOptions({ [option]: value }), editor)
					: (editor.model.getOption(option))
			)
		})

		// Configure the editor
		editor
			.option('selectionStyle', 'text')
			.option('mergeUndoDeltas', 'always')
			.option('wrap', true)
			.option('fontSize', '16px')
			.option('showPrintMargin', false)
	}

	// Return public interface
	return {
		..._
	}

})()

PolyTeXClient.init();