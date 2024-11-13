# polytex

An implementation of a distributed LaTeX editing service for collaborative LaTeX projects.

> Note to devs: update the `ENGINE_PATH` in `PdfTeXEngine.js` when moving files around. The relative path should account for how PdfTexEngine.js is served.

**TODO:**

* Add a warmup script that loads all the latex dependencies needed... (use the preamble for PhO^2)
* Add a graphical way to compile and do other stuff 
* Manage dependencies properly, and fix the DOM + Palette libraries (make them standalones)
* Implement server-side synchronization using diff-match-patch