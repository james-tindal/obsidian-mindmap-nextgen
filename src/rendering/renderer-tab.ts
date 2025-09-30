import { IMarkmapOptions } from 'markmap-view'
import { TFile } from 'obsidian'
import { IPureNode } from 'markmap-common'

import { FileSettings, globalSettings } from 'src/settings/filesystem'
import { ScreenshotColors, takeScreenshot } from 'src/rendering/screenshot'
import { createMarkmap, getOptions, transformMarkdown, splitMarkdown } from './renderer-common'
import { MindmapTab } from 'src/utilities/types'
import { svgs } from 'src/core/main'


export type TabRenderer = ReturnType<typeof TabRenderer>
export function TabRenderer(containerEl: MindmapTab.View['containerEl']) {
  const contentEl = containerEl.children[1]
  const { svg, markmap, toolbar } = createMarkmap({ parent: contentEl, toolbar: true })

  const state: {
    hasRendered: boolean
    screenshotColors?: ScreenshotColors
    markmapOptions?: Partial<IMarkmapOptions>
  } = {
    hasRendered: false
  }

  return { collapseAll, firstRender, render,
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
  function collapseAll() {
    markmap.setData(markmap.state.data, {
      ...state.markmapOptions,
      initialExpandLevel: 0,
    })
  }

  async function firstRender(file: TFile) {
    if (state.hasRendered) return
    state.hasRendered = true
    await render(file)
    markmap.fit()
  }

  async function render(file: TFile, content?: string) {
    svgs.set(svg, file)

    if (!state.hasRendered) return

    const markdown = content ?? await app.vault.cachedRead(file)
    
    const rootNode = transformMarkdown(markdown)
    const { settings: fileSettings } = splitMarkdown('file', markdown)
    const settings: FileSettings = { ...globalSettings, ...fileSettings }
    const markmapOptions = getOptions(settings)

    if (settings.titleAsRootNode)
      addTitleToRootNode(rootNode, file.basename)

    state.markmapOptions = markmapOptions

    await markmap.setData(rootNode, markmapOptions)
  }

  function addTitleToRootNode(root: IPureNode, title: string) {
    if (root.content == '') root.content = title
    else root = { content: title, children: [root] }
  }
}
