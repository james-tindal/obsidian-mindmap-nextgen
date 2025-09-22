import { MarkdownPostProcessorContext, MarkdownRenderChild, MarkdownSectionInformation } from 'obsidian'
import Callbag from 'src/utilities/callbag'
import { nextTick } from 'src/utilities/utilities'


const _codeBlockCreated = Callbag.subject<CodeBlock>()
export const codeBlockCreated = _codeBlockCreated.source
const _codeBlockDeleted = Callbag.subject<CodeBlock>()
export const codeBlockDeleted = _codeBlockCreated.source

const codeBlocks = new Set<CodeBlock>
Callbag.subscribe(codeBlockCreated, codeBlock =>
  codeBlocks.add(codeBlock))
Callbag.subscribe(codeBlockDeleted, codeBlock =>
  codeBlocks.delete(codeBlock))

export const getCodeBlocks = (filePath: string) =>
  [...codeBlocks].filter(codeBlock =>
    codeBlock.ctx.sourcePath === filePath
  )

export interface CodeBlock {
  markdown: string,
  containerEl: HTMLElement,
  getSectionInfo(): MarkdownSectionInformation | null
  ctx: MarkdownPostProcessorContext
}

export async function codeBlockHandler(markdown: string, containerEl: HTMLElement, ctx: MarkdownPostProcessorContext) {
  const childComponent = new MarkdownRenderChild(containerEl)
  ctx.addChild(childComponent)

  const codeBlock = {
    markdown, containerEl, ctx,
    getSectionInfo: () => ctx.getSectionInfo(containerEl)
  }

  // elements aren't added to the DOM until after this function returns.
  // this puts "codeBlock created" after "tab opened"
  await nextTick()

  _codeBlockCreated.push(codeBlock)
  childComponent.register(() =>
    _codeBlockDeleted.push(codeBlock))
}
