/**
 * @ Author: Mo David
 * @ Create Time: 2024-11-13 12:54:56
 * @ Modified time: 2024-11-13 15:38:18
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
	const output = {};

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
		renderer.scale = window.devicePixelRatio || 1;
		renderer.transform = renderer.scale !== 1 ? [renderer.scale, 0, 0, renderer.scale, 0, 0] : null;

		// Latex compilation engine
		// promisify() is another similar utility for chaining methods onto the promise returned by loadEngine()
		compiler.engine = new PdfTeXEngine();
		compiler.files = {}
		compiler.promisify = (f) => (...args) => 
			(compiler.promise.then(() => f(...args)), compiler)

		// Document information
		// Output page is a helper function that renders a page object with a given scale 
		output.document = null;
		output.page_count = 0;
		output.page = (page, scale=1) => 
			((viewport) => (
				renderer.element.width = Math.floor(viewport.width * renderer.scale),
				renderer.element.height = Math.floor(viewport.height * renderer.scale),
				renderer.element.style.width = Math.floor(viewport.width) + 'px',
				renderer.element.style.height =  Math.floor(viewport.height) + 'px',
				page.render({
					canvasContext: renderer.context,
					transform: renderer.transform,
					viewport: viewport
				})
			))(page.getViewport({ scale }))

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
				renderer.promise.then((pdf) => (output.document = pdf, output.page_count = pdf.numPages)),
				renderer
			),

			// Renders a specific page unto the canvas element
			page: (page, scale) => (
				renderer.promise.then(() => (

					// If output document exists, render the page we want
					output.document && output.document
						.getPage(Math.min(Math.max(1, page), output.page_count))
						.then((page) => output.page(page, scale))
				))
			)
		})

		// Extend the compiler
		Object.assign(compiler, {
			
			// Get-setter for the main file of the document
			main: compiler.promisify((main) => (
				main 
					? (compiler.main_file = main, compiler.engine.setEngineMainFile(main), compiler) 
					: (compiler.main_file)
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

// ! remove this
const tex = `
\\documentclass{article}
\\usepackage[utf8]{inputenc}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

%%%%%%% ---------- DOCUMENT ENGRAVING ---------- %%%%%%%
\\usepackage{geometry}                   % margins
\\geometry{a4paper, top=1in, bottom=1in, left=0.6in, right=0.6in}
\\setlength{\\parindent}{0in}
\\setlength{\\parskip}{0.1in}

%%%%%%% ---------- DOCUMENT LAYOUT ---------- %%%%%%%
\\usepackage{xcolor}                     % colors
\\usepackage{svg}                        % vector images
\\svgsetup{inkscapepath=svgsubdir}
\\usepackage{graphicx}                   % images 
\\usepackage{wrapfig}                    % wrapping images 
\\usepackage{tabularx}                   % tables
\\usepackage{makecell}                   % makecell uwu
\\usepackage{enumerate}                  % lists
\\usepackage[shortlabels]{enumitem}      % fancy lists
\\usepackage{fancyhdr}                   % headers
\\usepackage{nopageno}                   % no page number
\\usepackage{multicol}                   % multiple columns
\\usepackage{multirow}                   % multiple rows
\\usepackage{setspace}                   % spacing

\\setlist[enumerate]{font={\\bfseries}}% global settings, for all lists
\\setlist[enumerate,1]{label={(\\alph*)}}

%%%%%%% ---------- FONTS AND EMBOSSING ---------- %%%%%%%
\\usepackage{amsmath}
\\usepackage{amssymb} 
\\usepackage{bm}
\\usepackage[T1]{fontenc}                % other encoding
\\usepackage{amsfonts}                   % basic math syntax
\\usepackage{mathtools}                  % other math shit
\\usepackage{textcomp}                   % more math symbols
\\usepackage{gensymb}                    % more math symbols
\\usepackage{esint}                      % more integral symbols
\\usepackage{physics}                    % physics symbols
\\usepackage{ifthen}                     % conditionals - *OBSOLETE
\\usepackage[normalem]{ulem}             % underlining
\\usepackage{listings}                   % source code / mono
\\usepackage{textgreek}                  % upright greek letters
%\\usepackage{emoji}                      % emoji
%\\setemojifont{TwemojiMozilla}
% \\usepackage{xeCJK}                      % chinese xd
\\usepackage[T1]{fontenc}
\\usepackage{soul}                       % strikethrough
\\usepackage{titlesec}                   % change section format
\\usepackage{parskip}                    % paragraph skips
\\setlength{\\parskip}{\\medskipamount}

%%%%%%% ---------- PROBLEM WRITING ---------- %%%%%%%
\\usepackage{siunitx}                    % nice SI units
\\usepackage{cancel}                     % cancel

%%%%%%% ---------- DRAWING AND DESIGN ---------- %%%%%%%
% A. OTHERS
\\usepackage[version=3]{mhchem}          % chemistry
\\usepackage[RPvoltages]{circuitikz}     % circuits
\\usepackage{wrapfig}                    % images and figures
\\usepackage{float}                      % figure floats
\\usepackage[most]{tcolorbox}            % colored boxes

% B. PGFPLOTS
\\usepackage{pgfplots}                   % plots
\\pgfplotsset{compat=1.16}    

% C. TIKZ PACKAGE
\\usepackage{tkz-euclide}                % anything pretty much
\\usetikzlibrary{patterns}
\\usetikzlibrary{patterns.meta}
\\usepackage{tikz-3dplot}
\\usepackage{dashrule}
\\usetikzlibrary{3d}

%%%%%%% ---------- LATEX ---------- %%%%%%%
\\usepackage{standalone}                 % figures from sep. files
%\\usepackage{fontspec}                   % fix fonts
\\usepackage{import}                     % import files
\\usepackage{lipsum}                     % filler text
\\usepackage{stringstrings}

%%%%%%% ---------- COLOR DEFINITIONS ---------- %%%%%%%
\\definecolor{blu}{RGB}{0, 53, 84}
\\definecolor{gren}{RGB}{80, 253, 209}
\\definecolor{pnk}{RGB}{255,181,223}
\\definecolor{cyan1}{RGB}{177, 248, 255}
\\definecolor{cyan2}{RGB}{36, 181, 207}
\\definecolor{fakewhite}{RGB}{246, 253, 255}
\\definecolor{reddish}{RGB}{165, 28, 64}
\\definecolor{pinkish}{RGB}{255, 240, 243}
\\definecolor{gry}{RGB}{230, 230, 230}

%%%%%%% ---------- HYPERLINKS ---------- %%%%%%%
\\usepackage{hyperref}
\\hypersetup{
    colorlinks=true,
    linkcolor=black,
    filecolor=cyan2,      
    urlcolor=cyan2,
    }
\\urlstyle{same}

%%%%%%% ---------- CUSTOM FONTS ---------- %%%%%%%
% \\setsansfont{Poppins}[
%     Path=./fonts/Poppins/,
%     Scale=0.9,
%     Extension = .ttf,
%     UprightFont=*-Regular,
%     BoldFont=*-Bold,
%     ItalicFont=*-Italic,
%     BoldItalicFont=*-BoldItalic
% ]
% \\setmonofont{RobotoMono}[
%     Path=./fonts/RobotoMono/,
%     Scale=0.85,
%     Extension = .ttf,
%     UprightFont=*-Regular,
%     BoldFont=*-Bold,
%     ItalicFont=*-Italic,
%     BoldItalicFont=*-BoldItalic
% ]
% \\newfontfamily{\\Spartan}{Spartan}[
%     Path=./fonts/Spartan/,
%     Scale=0.85,
%     Extension = .ttf,
%     UprightFont=*-Regular,
%     BoldFont=*-Bold
% ]

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% \\renewcommand{\\familydefault}{\\sfdefault} % comment this shit if u really hate it
\\usepackage [autostyle, english = american]{csquotes} % good quotes
\\MakeOuterQuote{"} % good quotes
% have to get rid of this for emojis to work
\\lstset{
    basicstyle=\\small\\ttfamily,
    breaklines=true
}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

%%%%%%% ---------- CONTEST MACROS ---------- %%%%%%%
\\newcommand{\\pho}{$\\text{(PhO)}^2\\text{ }$}

%%%%%%% ---------- PROBLEM MACROS ---------- %%%%%%%
% A. PROBLEM NUMBER
\\newcounter{probno}

% For problems with no attached figure:
% \\problem{title}{problem}{comment}{author}
\\newcommand{\\problem}[4]{
    \\stepcounter{probno}
    \\resetskipindent
    \\setlength{\\parindent}{0in}
    \\paragraph{Problem \\theprobno: #1}
    % \\begin{large}
    %     P\\theprobno: #1
    % \\end{large}
    #2
    
    \\begin{small}
        \\begin{flushright}
        \\textit{#3} \\\\ \\vspace{0.5em}
        \\textemdash \\quad #4
        \\end{flushright}
    \\end{small}
    
    \\vspace{0.08in}
    % \\begin{tabularx}{\\textwidth}{Xr}
    %     \\textit{#3} & \\textemdash \\quad #4
    % \\end{tabularx}
}

% For problems with attached figure:
% \\problemfig{title}{problem}{comment}{author}{filepath with extension}{figure width}
\\newcommand{\\problemfig}[6]{
    \\noindent \\begin{minipage}[t]{\\directlua{tex.print(1 - (1.2 * #6))}\\linewidth}
        \\problem{#1}{#2}{#3}{#4}
    \\end{minipage}
    \\hfill
    \\begin{minipage}[t]{#6\\linewidth}
        \\resetskipindent
        \\begin{figure}[H]
            \\centering
            \\directlua{
                if string.sub("#5", -3, -1) == "svg" then
                    tex.print("\\string\\\\includesvg[width=1\\string\\\\textwidth]{#5}")
                else
                    tex.print("\\string\\\\includegraphics[width=1\\string\\\\textwidth]{#5}")
                end
            }
        \\end{figure}
    \\end{minipage}
    
    \\vspace{0.1in}
    % \\begin{tabularx}{\\textwidth}{Xr}
    %     \\textit{#3} & \\textemdash \\quad #4
    % \\end{tabularx}
}

\\newcommand{\\problemfigbelow}[6]{
    \\noindent 
    \\problem{#1}{#2}{#3}{#4}
    \\begin{figure}[H]
        \\centering
        \\directlua{
            if string.sub("#5", -3, -1) == "svg" then
                tex.print("\\string\\\\includesvg[width=#6\\string\\\\textwidth]{#5}")
            else
                tex.print("\\string\\\\includegraphics[width=#6\\string\\\\textwidth]{#5}")
            end
        }
    \\end{figure}
    
    \\vspace{0.1in}
    % \\begin{tabularx}{\\textwidth}{Xr}
    %     \\textit{#3} & \\textemdash \\quad #4
    % \\end{tabularx}
}


% B. SOLUTION
% For problems needing just one solution
% @argument #1 The solution itself
% testing something - franco
\\newcommand{\\solution}[1]{
    \\begin{tcolorbox}[
        enhanced jigsaw,
        breakable,
        pad at break*=1mm, 
        arc = 0em,
        outer arc = 0em,
        toptitle = 1.5em,
        bottomtitle = 0.5em,
        top = 0.5em,
        bottom = 1.5em,
        width = \\textwidth, 
        title={\\large \\textbf{Solution}},
        colback = {gry},
        colbacktitle = {gry}, 
        colframe = {gry},
        coltitle = {black}
        ]
        \\setlength{\\parskip}{\\medskipamount}
        \\setlength{\\parindent}{0in} #1
    \\end{tcolorbox}
    % \\newpage
}

% For problems needing just one solution
% @argument #1 The solution number (maybe with desc)
%              Example: "1 (with calculus)"
% @argument #2 The solution itself
\\newcommand{\\solutionmultiple}[2] {
    \\begin{tcolorbox}[
        enhanced jigsaw,
        breakable,
        pad at break*=1mm,
        arc = 0em,
        outer arc = 0em,
        toptitle = 1.5em,
        bottomtitle = 0.5em,
        top = 0.5em,
        bottom = 1.5em,
        width=\\textwidth, 
        title={\\large \\textbf{Solution #1}},
        colback = {gry},
        colbacktitle = {gry}, 
        colframe = {gry},
        coltitle = {black}
        ]
        #2
    \\end{tcolorbox}
}

% C. NUMBER OF POINTS
\\newcommand{\\points}[1]{
    \\ifnum#1=1
        \\textbf{(1 point)}
    \\else 
        \\textbf{(#1 points)}
    \\fi
}

% D. DISPLAY PROBLEM SOLUTION TOGETHER
\\newcommand{\\problemsolution}[1] {
    \\input{problems/#1}
    \\input{solutions/#1}
}

%%%%%%% ---------- FIGURE MACROS ---------- %%%%%%%
\\newcommand{\\gear}[6]{%
  (0:#2)
  \\foreach \\i [evaluate=\\i as \\n using {\\i-1)*360/#1}] in {1,...,#1}{%
    arc (\\n:\\n+#4:#2) {[rounded corners=1.5pt] -- (\\n+#4+#5:#3)
    arc (\\n+#4+#5:\\n+360/#1-#5:#3)} --  (\\n+360/#1:#2)
  }%
  (0,0) circle[radius=#6] 
}

%%%%%%% ---------- MATH OPERATORS ---------- %%%%%%%
\\DeclareMathOperator{\\arccosh}{arccosh}
\\DeclareMathOperator{\\arcsinh}{arcsinh}
\\DeclareMathOperator{\\arctanh}{arctanh}
\\DeclareMathOperator{\\arcsech}{arcsech}
\\DeclareMathOperator{\\arccsch}{arccsch}
\\DeclareMathOperator{\\arccoth}{arccoth} 

%%%%%%% ---------- DEGREE MACROS ---------- %%%%%%%
\\newcommand{\\dC}{\\degree \\text{C}}
\\newcommand{\\delC}{\\text{ C}\\degree}

%%%%%%% ---------- UNIT MACROS ---------- %%%%%%%
\\newcommand{\\unitf}[1]{\\,\\mathrm{#1}}
\\newcommand{\\de}[1]{\\, {\\rm d}#1}
\\DeclareSIUnit\\kt{kt}
\\DeclareSIUnit\\foot{ft}

% \\usepackage{xwatermark}
% \\newwatermark[textmark=test]{}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

%%%%%%% ---------- TITLE FORMAT ---------- %%%%%%%
\\titleformat{\\section}{\\bfseries\\huge}{}{0.5em}{}[] 

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

%%%%%%% ---------- PLAYGROUND ---------- %%%%%%%

\\newcommand{\\resetskipindent}{
    \\setlength{\\parskip}{\\medskipamount}
    \\setlength{\\parindent}{0.3in}
}

\\newcommand{\\veca}[1]{\\va{\\bm{#1}}}
\\newcommand{\\vechat}[1]{\\hat{\\bm{#1}}}

\\sisetup{math-micro=\\text{µ},text-micro=µ}

\\begin{document}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\\setstretch{1.15}

\\begin{center}

    \\vspace*{2em}

    \\huge{\\textbf{Philippine Online Physics Olympiad 2025}} \\\\[0.25em]
    \\huge{Problem Longlist}
    
    \\vspace{3em}
    
    \\large{\\textbf{Organized by:}} \\\\[0.2em]
    Motherfuckers
    
    \\vspace{3em}
    
    \\large{\\textbf{Problem Contributors:}} \\\\[0.2em]
    % Joaquin Butial \\\\
    Dominic Lawrence Bermudez \\\\
    Franco Mari Cabral \\\\
    Kiersten Gene Calubaquib \\\\
    Harold Scott Chua \\\\
    % Mo David \\\\
    Benjamin Jacob \\\\
    Caesar Lopez, Jr. \\\\
    Enrico Rolando Martinez \\\\
    Dirk Erwin Tardecilla \\\\
    
    \\vspace{3em}
    
    \\large{\\textbf{Website Developer:}} \\\\[0.2em]
    Malks Mogen David
    
\\end{center}


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\\pagebreak

\\setstretch{1}

\\pagestyle{fancy}
\\fancyhf{}
\\rhead{February 2025}
\\lhead{Philippine Online Physics Olympiad -- $\\text{(PhO)}^2$ 2025}
\\rfoot{Problem Longlist -- Page \\thepage}

\\setcounter{page}{1}
% \\input{sections/instructions}

\\section*{Table of Constants} % let's rewrite all of these
\\begin{multicols}{2}
\\begin{enumerate}
    \\item Universal Constants
    \\begin{itemize}
        \\item Gravitational Constant: \\\\ $G = \\SI{6.67e-11}{Nm^2/kg^2}$
        \\item Acceleration due to Gravity on Earth: \\\\ $g = \\SI{9.81}{m/s^2}$
        \\item Radius of Earth: $R_E = \\SI{6370}{km}$
        \\item Mass of Earth: $M_E = \\SI{5.972e24}{kg}$
        \\item Mass of Sun: $M_S = \\SI{1.989e30}{kg}$
        \\item Mass of Moon: $M_m = \\SI{7.35e22}{kg}$
        \\item Radius of Moon: $M_m = \\SI{1740}{km}$
        \\item Universal Gas Constant: \\\\ $R = \\SI{8.314}{J/(mol \\cdot K)} = \\SI{0.08206}{\\qty(L\\cdot atm) / \\qty(mol\\cdot K)}$
        \\item Avogadro's Number: \\\\ $N_A = \\SI{6.022e23}{mol^{-1}}$
        \\item Vacuum Permittivity: \\\\ $\\epsilon_0 = \\SI{8.854e-12}{C^2/(N \\cdot m^2)}$
        \\item Vacuum Permeability: \\\\ $\\mu_0 = 4\\pi \\times 10^{-7} \\, \\si{H/m}$
        \\item Planck's Constant: $h = \\SI{6.626e-34}{J \\cdot s}$
        \\item Mass of Proton: $m_p = \\SI{1.673e-27}{kg}$
        \\item Mass of Neutron: $m_n = \\SI{1.675e-27}{kg}$
        \\item Mass of Electron: $m_e = \\SI{9.11e-31}{kg}$
        \\item Charge of Electron: $e = \\SI{1.602e-19}{C}$
        \\item Speed of Light: $c = \\SI{2.998e8}{m/s}$
        \\item Speed of Sound (at $0\\dC$): $v_{s} = \\SI{331}{m/s}$
        \\item Stefan-Boltzmann Constant: \\\\ $\\sigma = \\SI{5.67e-8}{W/(m^2 \\cdot K^4)}$
    \\end{itemize}
    % \\item Constants of Various Materials
    % \\begin{itemize}
    %     \\item Density of Water: $\\rho_{\\ce{H2O}} = \\SI{1000}{kg/m^3}$
    %     \\item Density of Iron: $\\rho_{\\ce{Fe}} = \\SI{7870}{kg/m^3}$
    %     \\item Density of Steel: $\\rho = \\SI{8000}{kg/m^3}$
    %     \\item Specific Heat of Water: \\\\ $c_{\\ce{H2O}} = \\SI{4.180}{kJ/(kg \\cdot K)}$
    %     \\item Latent Heat of Fusion of Water: \\\\ $L_f = \\SI{334}{kJ/kg}$
    %     \\item Latent Heat of Vaporization of Water: $L_v = \\SI{2260}{kJ/kg}$
    %     \\item Young's Modulus of Iron: $Y_{\\ce{Fe}} = \\SI{170}{GPa}$
    %     \\item Young's Modulus of Steel: $E = \\SI{200}{GPa}$
    %     \\item Surface Tension of Water at $20\\degree C$: \\\\ $\\gamma = \\SI{0.072}{N/m}$
    %     \\item Refractive Index of Glass: $n = 1.52$
    %     \\item Refractive Index of Saltwater: $n = 1.40$
    %     \\item Refractive Index of Water: $n = 1.33$
    %     \\item Refractive Index of Ice: $n = 1.31$
    %     \\item Refractive Index of Air: $n = 1.00$
    % \\end{itemize}
    \\item Conversions
    \\begin{itemize}
        \\item Calories: $\\SI{1}{Cal} = \\SI{1000}{cal} = \\SI{4180}{J}$
        \\item One Year: $\\SI{1}{year} = \\SI{365.25}{days}$
        \\item Atmospheric Pressure: \\\\ $\\SI{1}{atm} = \\SI{101325}{Pa}$
        \\item Kelvin: $\\SI{0}{\\dC} = \\SI{273.15}{K}$
        \\item Astronomical Units: $\\SI{1}{AU} = \\SI{1.496e11}{m}$
    \\end{itemize}
\\end{enumerate}
\\end{multicols}

\\pagebreak

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% \\section*{Fluids}

\\problem{Laser Gun}{

Alice and Bob are situated in a rectangular prism  enclosed by perfectly reflective mirrors. One corner of the room is situated at $(\\SI{0}{m}, \\SI{0}{m}, \\SI{0}{m}$), while the opposite corner is situated at $(\\SI{3}{m}, \\SI{4}{m}, \\SI{5}{m})$. All faces of the room are parallel to the $xy$-, $yz$-, and $zx$-planes. 

Alice is located at the point at $(\\SI{1}{m}, \\SI{1}{m}, \\SI{1}{m}$). She has a laser gun which does not lose its energy as it reflects upon each mirror. Meanwhile, Bob is located at the point $(\\SI{2.5}{m}, \\SI{2.5}{m}, \\SI{2.5}{m}$). He is trying to avoid detection by this gun. In order to protect himself from Alice, he can place a \\textit{blocker ball} at any point inside the prism,  which is a point-like ball that can absorb the laser beam. However, since Bob is under the budget of the Indonesian government, he wants to minimize the number of blocker balls he can use. 

Suppose that $\\mathcal{S}$ is the set with the smallest number of blocker balls where Bob can fully defend himself. Define $x_\\text{max}$ to be the maximum $x$-coordinate of all blocker balls in $\\mathcal{S}$ and $x_\\text{min}$ to be the minimum $x$-coordinate of all blocker balls in $\\mathcal{S}$. Define $y_\\text{max}$, $y_\\text{min}$, $z_\\text{max}$, and $z_\\text{min}$ similarly.

\\begin{enumerate}
		\\item Find the smallest cardinality of $\\mathcal{S}$. Express your answer as an \\textbf{integer}.
		\\item Find $|x_\\text{max} - x_\\text{min}| \\cdot |y_\\text{max} - y_\\text{min}| \\cdot |z_\\text{max} - z_\\text{min}|$. Express your answer in \\textbf{5 significant figures}.
\\end{enumerate}

The \\textit{cardinality} of a set refers to the number of elements in a set. 

(\\textit{Hint:} There is a solution with finitely many balls in $\\mathcal{S}$ that are strategically placed inside the prism. You might think of creating a rectangular prism around Alice, but this requires infinitely many balls and is not our required solution.)

}
{Bang bang}{BJ}

\\solution{
	For the first problem, we assume that a person runs at an average of $v = \\SI{5.00}{\\m/\\s}$. For someone to be able to "run", their running speed must be less than the velocity $v_o$ required to enter into a circular orbit around the asteroid. It is indeed possible to enter into orbit with a velocity smaller than $v_o$, but these orbits are ellipses that intersect with the surface of the asteroid. That is, the astronaut's feet will still touch the ground at some point during their journey, so it is still counted as running.

	\\begin{align*}
			\\Rightarrow v &< v_0 \\\\
			\\Rightarrow v &< \\sqrt{\\frac{GM}{R}} \\\\
			\\Rightarrow v &< \\sqrt{\\frac{4}{3} \\pi G \\rho_M R^2} \\\\
			\\Rightarrow R &> v\\sqrt{\\frac{3}{4 \\pi G \\rho_M}} \\\\
	\\end{align*}

	Thus, the minimum radius of the asteroid is \\boxed{\\SI{5180}{m}}.

	Meanwhile, for the second problem, we assume that a person can jump an average of $h = \\SI{50}{\\centi\\m}$. Associated with this jump height is the person's initial speed as they leave the ground, given by:
	$$
	v = \\sqrt{2 g_\\oplus h}
	$$
	For the problem's condition to be satisfied,

	\\begin{align*}
			\\Rightarrow v &> v_0 \\\\
			\\Rightarrow \\sqrt{2 g_\\oplus h} &> \\sqrt{\\frac{GM}{R}} \\\\
			\\Rightarrow 2 g_\\oplus h &> \\frac{4}{3} \\pi G \\rho_\\oplus R^2 \\\\
			\\Rightarrow R &< \\sqrt{\\frac{3 g_\\oplus h}{2 \\pi G \\rho_\\oplus}}  \\\\
	\\end{align*}

	Thus, the maximum radius of the planet is \\boxed{\\SI{2520}{m}}.
}

\\end{document}
`
// PolyTeXClient
// 	.file('main.tex', tex)
// 	.compile('main.tex')
// 	.render(1)

// Command palette setup
Palette.register_command('compile', { 
	action: () => PolyTeXClient.file('main.tex', tex).compile('main.tex').render(1), 
	description: 'Compiles main.tex.' 
})

// ! remove
let page = 1;
DOM.select('.previous-button').listen('click', () => (--page, page = Math.max(1, page), PolyTeXClient.render(page)))
DOM.select('.next-button').listen('click', () => (++page, PolyTeXClient.render(page)))