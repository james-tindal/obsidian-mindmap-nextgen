import { Editor, MarkdownPostProcessorContext, MarkdownRenderChild, MarkdownSectionInformation, MarkdownView, TFile } from 'obsidian'
import Callbag from 'src/utilities/callbag'
import { assert, defineLazyGetters, nextTick, notNullish } from 'src/utilities/utilities'


const _codeBlockCreated = Callbag.subject<CodeBlock>()
export const codeBlockCreated = _codeBlockCreated.source
const _codeBlockDeleted = Callbag.subject<CodeBlock>()
export const codeBlockDeleted = _codeBlockDeleted.source

const codeBlocks = new Set<CodeBlock>
Callbag.subscribe(codeBlockCreated, codeBlock =>
  codeBlocks.add(codeBlock))
Callbag.subscribe(codeBlockDeleted, codeBlock =>
  codeBlocks.delete(codeBlock))

export const getCodeBlocksByPath = (filePath: string) =>
  [...codeBlocks].filter(codeBlock =>
    codeBlock.ctx.sourcePath === filePath
  )

export interface CodeBlock {
  component: MarkdownRenderChild
  markdown: string
  containerEl: HTMLElement
  getSectionInfo(): MarkdownSectionInformation | null
  ctx: MarkdownPostProcessorContext
  markdownView: MarkdownView
  editor: Editor
  file: TFile
}

export async function codeBlockHandler(markdown: string, containerEl: HTMLElement, ctx: MarkdownPostProcessorContext) {
  const component = new MarkdownRenderChild(containerEl)
  ctx.addChild(component)

  // containerEl is appended to the DOM after this function returns
  await nextTick()

  const markdownView = getMarkdownView(containerEl)
  const editor = markdownView.editor

  const codeBlock = defineLazyGetters({
    component, markdown, containerEl, ctx, markdownView, editor,
    getSectionInfo: () => ctx.getSectionInfo(containerEl),
  }, {
    file: () => getFileByPath(ctx.sourcePath),
  })

  _codeBlockCreated.push(codeBlock)
  component.register(() =>
    _codeBlockDeleted.push(codeBlock))
}

function getMarkdownView(containerEl: HTMLElement) {
  const markdownViewLeaf =
    app.workspace.getLeavesOfType('markdown')
    .find(leaf => leaf.containerEl.contains(containerEl))
  assert(notNullish, markdownViewLeaf, "Couldn't find MarkdownView containing code block")
  return markdownViewLeaf.view as MarkdownView
}

function getFileByPath(sourcePath: string) {
  const file = app.vault.getFileByPath(sourcePath)
  assert(notNullish, file)
  return file
}
