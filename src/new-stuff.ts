

// How to get fileSettings$?
// File opens before its renderers are constrcuted

import { Editor, parseYaml, TFile } from "obsidian"
import { FRONT_MATTER_REGEX } from "./constants"
import { Callbag } from "./utilities"




type Frontmatter = Partial<{
  markmap: Partial<{
    highlight: boolean;
  }>
}>
const getFrontmatter1 = (file: TFile) =>
  new Promise<Frontmatter>(resolve =>
    app.fileManager.processFrontMatter(file, resolve));
const getFrontmatter2 = (editor: Editor) => {
  const str = FRONT_MATTER_REGEX.exec(editor.getValue())?.[0].slice(4, -4);
  return str && parseYaml(str)
}
  

const frontmatter$ = Callbag.create<Frontmatter>(next => {
  app.workspace.on("file-open", file =>
    file?.extension === 'md' &&
    getFrontmatter1(file).then(next))
  app.workspace.on("editor-change", (editor, { file }) =>
    file?.extension === 'md' &&
    next(getFrontmatter2(editor)))
})


// get global settings stream and combine with that


// Make a stream of the frontmatter AND the rest of the string.
// Never pass the frontmatter to markmap




// FIRST
// Need codeblocks.ts to keep a set of all open files.
