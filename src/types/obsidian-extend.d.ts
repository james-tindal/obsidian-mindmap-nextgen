import type { CodeBlockPostProcessorHandler } from '@obsidian-typings/obsidian-public-latest'
import 'obsidian'

declare module 'obsidian' {
  interface Workspace {
    trigger(name: 'hover-link', data: {
      event: MouseEvent
      source: string
      hoverParent: HoverParent | Element
      targetEl: Element | null
      linktext: string
      sourcePath?: string
      state?: {
        scroll: unknown
      }
    }): void

    activeTabGroup: WorkspaceTabs | null | undefined

    createLeafInParent(parent: WorkspaceParent, index: number): WorkspaceLeaf
  }

  interface WorkspaceTabs {
    children: WorkspaceLeaf[]

    insertChild(index: number, child: WorkspaceLeaf): void
  }

  type Recycler = (
    element: HTMLElement,
    recycledSections: unknown[],
  ) => void

  namespace MarkdownPreviewRenderer {
    /** Present in Obsidian 1.13.7 but missing from obsidian-typings. */
    const postProcessors: MarkdownPostProcessor[]
    const recyclers: Recycler[]

    function belongsToMe(
      element: HTMLElement,
      containerEl: HTMLElement,
      isDetached?: (element: HTMLElement) => boolean,
    ): boolean

    function registerCodeBlockPostProcessor(
      language: string,
      handler: CodeBlockPostProcessorHandler,
    ): void

    function registerRecycler(recycler: Recycler): void
    function unregisterRecycler(recycler: Recycler): void
  }
}
