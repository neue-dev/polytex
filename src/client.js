/**
 * @ Author: Mo David
 * @ Create Time: 2024-11-13 12:54:56
 * @ Modified time: 2024-11-13 14:50:13
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
	const renderer = {};
	const compiler = {};

	/**
	 * Initializes the client.
	 * 
	 * Extends the editor (powered by Ace editor).
	 * Extends the renderer (renders latex to PDFs).
	 */
	_.init = () => {
		
		// The editor element and its representation (via Ace)
		editor.element = document.getElementById('editor');
		editor.model = ace.edit(editor.element)

		// The pdf renderer
		// promisify() is a utility for chaining methods onto the promise returned by getDocument()
		renderer.element = document.getElementById('viewer');
		renderer.context = renderer.element.getContext('2d');
		renderer.document = null;
		renderer.scale = window.devicePixelRatio || 1;
		renderer.transform = renderer.scale !== 1 ? [renderer.scale, 0, 0, renderer.scale, 0, 0] : null;

		// Latex compilation engine
		// promisify() is another similar utility for chaining methods onto the promise returned by loadEngine()
		compiler.engine = new PdfTeXEngine();
		compiler.files = {}
		compiler.promisify = (f) => (...args) => 
			(compiler.promise.then(() => f(...args)), compiler)

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

			// Renders the provided pdf data and stores it in memory
			render: (data) => (
				renderer.promise = pdfjsLib.getDocument({ data }).promise,
				renderer.promise.then((pdf) => renderer.document = pdf),
				renderer
			),

			// Renders a specific page unto the canvas element
			page: (page, scale=1) => (
				renderer.promise.then(() => (
					renderer.document.getPage(page).then((page) => 
					
						// Use the viewport to config the canvas element
						((viewport) => (

							// Update canvas dimensions
							renderer.element.width = Math.floor(viewport.width * renderer.scale),
							renderer.element.height = Math.floor(viewport.height * renderer.scale),
							renderer.element.style.width = Math.floor(viewport.width) + 'px',
							renderer.element.style.height =  Math.floor(viewport.height) + 'px',

							// Render the page
							page.render({
								canvasContext: renderer.context,
								transform: renderer.transform,
								viewport: viewport
							})

						// Grab the viewport of the page
						))(page.getViewport({ scale }))
					)
				))
			)
		})

		// Extend the compiler
		Object.assign(compiler, {
			
			// Get-setter for the main file of the document
			main: compiler.promisify((main) => (
				main 
					? (compiler.main = main, compiler.engine.setEngineMainFile(main), compiler) 
					: (compiler.main)
			)),

			// Creates a folder in memory for holding latex files
			folder: compiler.promisify((folder) => (
				compiler.engine.makeMemFSFolder(folder)
			)),

			// Creates a file in memory
			file: compiler.promisify((file, content) => (
				compiler.files[file] = content,
				compiler.engine.writeMemFSFile(file, content)
			)),

			// CLears all the files uploaded to memory
			clear: compiler.promisify(() => (
				compiler.files = {},
				compiler.flushCache()
			)),

			// Compiles the latex files, starting from the main file
			compile: compiler.promisify(() => (
				compiler.compilation = compiler.engine.compileLaTeX()
			)),

			// Shutdown the engine
			close: compiler.promisify(() => (
				compiler.engine.closeWorker()
			)),

			// Pipes the result through a function
			result: (f) => compiler.promisify(() => (
				compiler.compilation
					.then(({ pdf, log }) => (console.warn(log), f(pdf), { pdf, log }))
			))()
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

		// Configure the compiler
		compiler.promise = compiler.engine.loadEngine()
		compiler.promise.then(() => console.log('Renderer is ready.'))
	}

	/**
	 * Creates a new folder in the renderer cache.
	 * 
	 * @param	folder	The folder name.
	 * @return				The api.
	 */
	_.folder = (folder) => (compiler.folder(folder), _)

	/**
	 * Creates a new file in the renderer cache.
	 * If the file exists, it simply overwrite the existing content of that file.
	 * 
	 * @param	file			The name of the file.
	 * @param	content		The content of the file.
	 * @return					The api.
	 */
	_.file = (file, content) => (editor.value(content), compiler.file(file, content), _)

	/**
	 * Compiles the tex files starting at the provided main file.
	 * 
	 * @param main	The main file to use. 
	 * @return			The api.
	 */
	_.compile = (main) => (compiler.main(main).compile(), _)

	/**
	 * Renders the document unto the canvas.
	 * If the document does not yet exist, nothing happens.
	 * 
	 * @param	page	The page of the document to render. Pages are 1-indexed.
	 * @return			The api.
	 */
	_.render = (page) => (compiler.result((data) => renderer.render(data).page(page)), _)

	// Init the client
	_.init()

	// Return public interface
	return {
		..._
	}

})()

const tex = `
\\documentclass{article}
\\usepackage{graphicx} % Required for inserting images

\\title{(PhO)\\^2 2025}
\\author{Enrico Martinez}
\\date{June 2024}

\\begin{document}

\\maketitle

\\section{Introduction}

\\end{document}
`
PolyTeXClient
	.file('main.tex', tex)
	.compile('main.tex')
	.render(1)