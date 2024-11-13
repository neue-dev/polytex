/**
 * @ Author: Mo David
 * @ Create Time: 2024-11-13 12:54:56
 * @ Modified time: 2024-11-13 13:58:28
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
	const renderer = {};

	/**
	 * Initializes the client.
	 * 
	 * Extends the editor (powered by Ace editor).
	 * Extends the renderer (renders latex to PDFs).
	 */
	_.init = () => {
		
		// Grab the correspnding DOM elements
		editor.element = document.getElementById('editor');
		viewer.element = document.getElementById('viewer');

		// The representation (from the Ace library) of the editor
		editor.model = ace.edit(editor.element)

		// Latex rendering engine
		renderer.engine = new PdfTeXEngine();
		renderer.files = {}

		// Utility for wrapping the extension methods of the renderer
		renderer.promisify = (f) => () => (renderer.promise.then(f), renderer)

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

		// Extend the renderer
		Object.assign(renderer, {
			
			// Get-setter for the main file of the document
			main: renderer.promisify((main) => (
				main 
					? (renderer.main = main, renderer.engine.setEngineMainFile(main), renderer) 
					: (renderer.main)
			)),

			// Creates a folder in memory for holding latex files
			folder: renderer.promisify((folder) => (
				renderer.engine.makeMemFSFolder(folder)
			)),

			// Creates a file in memory
			file: renderer.promisify((file, content) => (
				renderer.files[file] = content,
				renderer.engine.writeMemFSFile(file, content)
			)),

			// CLears all the files uploaded to memory
			clear: renderer.promisify(() => (
				renderer.files = {},
				renderer.flushCache()
			)),

			// Compiles the latex files, starting from the main file
			compile: renderer.promisify(() => (
				renderer.compilation = renderer.engine.compileLaTeX()
			)),

			// Shutdown the engine
			close: renderer.promisify(() => (
				renderer.engine.closeWorker()
			)),

			// Returns a promise for the result
			result: () => renderer.compilation
		})

		// Configure the editor
		editor
			.option('mode', 'ace/mode/latex')
			.option('theme', 'ace/theme/ambiance')
			.option('selectionStyle', 'text')
			.option('mergeUndoDeltas', 'always')
			.option('wrap', true)
			.option('fontSize', '16px')
			.option('showPrintMargin', false)

		// Configure the renderer
		renderer.promise = renderer.engine.loadEngine()
		renderer.promise.then(() => console.log('Renderer is ready.'))

		console.log(renderer.engine)
	}

	// Return public interface
	return {
		..._
	}

})()

PolyTeXClient.init();