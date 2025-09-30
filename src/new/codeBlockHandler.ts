import { Component, Editor, MarkdownPostProcessorContext, MarkdownRenderChild, MarkdownSectionInformation, MarkdownView, TFile } from 'obsidian'
import Callbag from 'src/utilities/callbag'
import { assert, defineLazyGetters, notNullish } from 'src/utilities/utilities'


export async function codeBlockHandler(markdown: string, containerEl: HTMLElement, ctx: MarkdownPostProcessorContext) {
  const component = new MarkdownRenderChild(containerEl)
  ctx.addChild(component)
  const markdownView = getMarkdownView(component)
  const editor = markdownView.editor

  const codeBlock = defineLazyGetters({
    component, markdown, containerEl, ctx, markdownView, editor,
    getSectionInfo: () => ctx.getSectionInfo(containerEl),
  }, {
    file: () => getFileByPath(ctx.sourcePath),
  })

  registerCodeBlock(codeBlock, component)
}

const _codeBlockCreated = Callbag.subject<CodeBlock>()
export const codeBlockCreated = _codeBlockCreated.source
const _codeBlockDeleted = Callbag.subject<CodeBlock>()
export const codeBlockDeleted = _codeBlockDeleted.source

function registerCodeBlock(codeBlock: CodeBlock, component: Component) {
  _codeBlockCreated.push(codeBlock)
  component.register(() =>
    _codeBlockDeleted.push(codeBlock))
}

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

function getMarkdownView(component: MarkdownRenderChild) {
  const leaves = app.workspace.getLeavesOfType('markdown')
  const leaf = leaves.find(leaf => {
    const view = leaf.view
    if (!(view instanceof MarkdownView)) return
    const subView = view.currentMode
    if (!('_children' in subView && Array.isArray(subView._children))) return
    return subView._children.contains(component)
  })
  assert(notNullish, leaf, "Couldn't find MarkdownView containing code block")
  return leaf.view as MarkdownView
}

function getFileByPath(sourcePath: string) {
  const file = app.vault.getFileByPath(sourcePath)
  assert(notNullish, file)
  return file
}
