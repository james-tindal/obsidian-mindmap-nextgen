import { MarkdownPostProcessorContext, MarkdownRenderChild, MarkdownSectionInformation, MarkdownView, parseLinktext, TFile } from 'obsidian'
import { plugin } from 'src/core/main'
import Callbag, { flatMap } from 'src/utilities/callbag'
import { defineLazyGetters } from 'src/utilities/utilities'
import { Simplify } from 'type-fest'


export type CodeBlock = ReturnType<typeof CodeBlock>
function CodeBlock(markdown: string, containerEl: HTMLElement, ctx: MarkdownPostProcessorContext) {
  const component = new MarkdownRenderChild(containerEl)
  ctx.addChild(component)
  const markdownView = getMarkdownView(component)
  const editor = markdownView?.editor

  const getSectionInfo = () =>
    ctx.getSectionInfo(containerEl) as SectionInfo

  return defineLazyGetters({
    component, markdown, containerEl, ctx, markdownView, editor, getSectionInfo
  }, {
    file: () => resolveFile(ctx, containerEl),
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
  return leaf?.view as MarkdownView | undefined
}

// Code blocks inside embeds / canvas cards are not hosted by a MarkdownView,
// and their ctx.sourcePath may be empty or point at a non-markdown file, so
// resolve the source file with a DOM fallback on the enclosing embed's src.
function resolveFile(ctx: MarkdownPostProcessorContext, containerEl: HTMLElement) {
  const sourceFile = ctx.sourcePath ? app.vault.getFileByPath(ctx.sourcePath) : undefined
  if (sourceFile?.extension === 'md') return sourceFile

  const embedSrc = containerEl.closest('.markdown-embed')?.getAttribute('src')
  if (embedSrc) {
    const { path } = parseLinktext(embedSrc)
    const dest = app.metadataCache.getFirstLinkpathDest(path, ctx.sourcePath || '')
    if (dest?.extension === 'md') return dest
  }

  return undefined
}
