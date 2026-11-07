import type { IMarkmapOptions } from 'markmap-view'
import type { Component, TFile } from 'obsidian'
import type { IPureNode } from 'markmap-common'

import { FileSettings, foldingStates, globalSettings } from 'src/settings/filesystem'
import { restoreFolding } from './folding'
import { ScreenshotColors, takeScreenshot } from 'src/rendering/screenshot'
import { createMarkmap, getOptions, transformMarkdown, splitMarkdown } from './renderer-common'
import { MindmapTab } from 'src/utilities/types'
import { registerInternalLinks } from 'src/internal-links/handle-internal-links'


export type TabRenderer = ReturnType<typeof TabRenderer>
export function TabRenderer(containerEl: MindmapTab.View['containerEl'], component: Component) {
  const contentEl = containerEl.children[1]
  const { svg, markmap, toolbar } = createMarkmap({ parent: contentEl, toolbar: true })

  const state: {
    file?: TFile
    hasRendered: boolean
    screenshotColors?: ScreenshotColors
    markmapOptions?: Partial<IMarkmapOptions>
  } = {
    hasRendered: false
  }

  registerInternalLinks(component, svg, () => state.file)

  let revision = 0
  let disposed = false
  let markdownContent: string | undefined
  const toggleNode = markmap.toggleNode.bind(markmap)
  markmap.toggleNode = (node, recursive) => {
    const result = toggleNode(node, recursive)
    rememberFolding()
    return result
  }
  component.register(() => {
    disposed = true
    revision++
    markmap.toggleNode = toggleNode
  })

  function rememberFolding() {
    if (!disposed && globalSettings.rememberFolding && state.file && markmap.state.data)
      foldingStates.save(state.file.path, markmap.state.data)
  }

  return { collapseAll, firstRender, render, resetFolding,
    takeScreenshot: () => takeScreenshot(markmap, state.screenshotColors!),
    toolbar: {
      get hidden() { return toolbar.hidden },
      toggle: () => 
        toolbar.hidden
        ? toolbar.hidden = false
        : toolbar.hidden = true
    }
  }

  // This relies on firstRender having already happened, so state.markmapOptions is set.
  async function collapseAll() {
    const rendering = markmap.setData(markmap.state.data, {
      ...state.markmapOptions,
      initialExpandLevel: 0,
    })
    rememberFolding()
    await rendering
  }

  async function resetFolding() {
    if (!state.file) return
    foldingStates.reset(state.file.path)
    await render(state.file, markdownContent)
  }

  async function firstRender(file: TFile) {
    if (state.hasRendered) return
    state.hasRendered = true
    await render(file)
    markmap.fit()
  }

  async function render(file: TFile, content?: string) {
    const currentRevision = ++revision
    if (!state.hasRendered || disposed) return

    const markdown = content ?? await app.vault.cachedRead(file)
    // A slower disk read must not replace a newer editor update or another note.
    if (disposed || currentRevision !== revision) return
    state.file = file
    markdownContent = markdown
    
    const rootNode = transformMarkdown(markdown)
    const { settings: fileSettings } = splitMarkdown('file', markdown)
    const settings: FileSettings = { ...globalSettings, ...fileSettings }
    const markmapOptions = getOptions(settings)

    if (settings.titleAsRootNode)
      addTitleToRootNode(rootNode, file.basename)

    state.markmapOptions = markmapOptions

    if (globalSettings.rememberFolding) {
      restoreFolding(rootNode, settings.initialExpandLevel, foldingStates.load(file.path))
      await markmap.setData(rootNode, { ...markmapOptions, initialExpandLevel: -1 })
      return
    }

    await markmap.setData(rootNode, markmapOptions)
  }

  function addTitleToRootNode(root: IPureNode, title: string) {
    if (root.content == '') root.content = title
    else root = { content: title, children: [root] }
  }
}
