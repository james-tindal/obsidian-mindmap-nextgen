import { MarkdownPostProcessorContext, MarkdownRenderChild, MarkdownSectionInformation, MarkdownView } from 'obsidian'
import { plugin } from 'src/core/main'
import Callbag, { flatMap } from 'src/utilities/callbag'
import { assert, defineLazyGetters, notNullish } from 'src/utilities/utilities'
import { Simplify } from 'type-fest'


export type CodeBlock = ReturnType<typeof CodeBlock>
function CodeBlock(markdown: string, containerEl: HTMLElement, ctx: MarkdownPostProcessorContext) {
  const component = new MarkdownRenderChild(containerEl)
  ctx.addChild(component)
  const markdownView = getMarkdownView(component)
  const editor = markdownView.editor

  const getSectionInfo = () =>
    ctx.getSectionInfo(containerEl) as SectionInfo

  return defineLazyGetters({
    component, markdown, containerEl, ctx, markdownView, editor, getSectionInfo
  }, {
    file: () => getFileByPath(ctx.sourcePath),
  })
}

export const codeBlockCreated = Callbag.share(
  Callbag.create<CodeBlock>((next, error, complete) => {
    plugin.registerMarkdownCodeBlockProcessor('markmap', (...args) => next(CodeBlock(...args)))
    plugin.register(complete)
  }))
const codeBlockDeleted = Callbag.pipe(
  codeBlockCreated,
  flatMap(codeBlock => Callbag.create<CodeBlock>((next, error, complete) => {
    codeBlock.component.register(() => next(codeBlock))
    plugin.register(complete)
  }))
)

const codeBlocks = new Set<CodeBlock>
Callbag.subscribe(codeBlockCreated, codeBlock =>
  codeBlocks.add(codeBlock))
Callbag.subscribe(codeBlockDeleted, codeBlock =>
  codeBlocks.delete(codeBlock))

export const getCodeBlocksByPath = (filePath: string) =>
  [...codeBlocks].filter(codeBlock =>
    codeBlock.ctx.sourcePath === filePath
  )

type SectionInfo = Simplify<MarkdownSectionInformation>

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
