import { ButtonComponent, EditorPosition } from 'obsidian'
import autoBind from 'auto-bind'
import GrayMatter from 'gray-matter'

import { CodeBlockSettings, FileSettings, globalSettings, GlobalSettings } from 'src/settings/filesystem'
import { cssClasses } from 'src/constants'
import { assert, exists, FileTab } from 'src/workspace/types'
import { createMarkmap, getOptions, parseMarkdown } from 'src/rendering/renderer-common'
import { renderCodeblocks$ } from 'src/rendering/style-features'
import Callbag, { fromEvent } from 'src/utilities/callbag'
import { CodeBlockSettingsDialog } from 'src/settings/dialogs'
import { isObjectEmpty } from 'src/utilities/utilities'
import { TabRow } from 'src/workspace/db-schema'
import { svgs } from 'src/core/entry'
import { dragAndDrop } from 'src/utilities/drag-and-drop'
import { CodeBlock } from 'src/new/codeBlockHandler'


export type CodeBlockRenderer = ReturnType<typeof CodeBlockRenderer>
export function CodeBlockRenderer(codeBlock: CodeBlock, tabView: FileTab.View, fileSettings: FileSettings, tabRow: TabRow) {
  const { markdown, containerEl } = codeBlock

  const { markmap, svg } = createMarkmap({ parent: containerEl, toolbar: false })
  svgs.set(svg, tabView.file)

  const { rootNode, settings: codeBlockSettings } = parseMarkdown<'codeBlock'>(markdown)

  const settings = new SettingsManager(tabView, codeBlock, fileSettings, codeBlockSettings)

  SizeManager(containerEl, svg, settings)

  if (tabView.getMode() === 'source')
    SettingsDialog(codeBlock, tabRow, codeBlockSettings)

  let hasFit = false
  function fit() {
    if (!hasFit) markmap.fit()
    hasFit = true
  }

  render()
  Callbag.subscribe(renderCodeblocks$, render)

  return { render, fit, updateFileSettings }

  function updateFileSettings(fileSettings: FileSettings) {
    settings.file = fileSettings
    render()
  }

  function render() {
    const markmapOptions = getOptions(settings.merged)
    markmap.setData(rootNode, markmapOptions)

    const { classList } = containerEl.parentElement!
    settings.merged.highlight
      ? classList.add   (cssClasses.highlight)
      : classList.remove(cssClasses.highlight)
  }
}

class SettingsManager {
  private newHeight: number | undefined
  private readonly DEFAULT_HEIGHT = 150
  private settings: {
    global: GlobalSettings
    file: FileSettings
    codeBlock: CodeBlockSettings
  }

  constructor(
    private tabView: FileTab.View,
    private __codeBlock: CodeBlock,
    fileSettings: FileSettings,
    codeBlockSettings: CodeBlockSettings
  ) {
    autoBind(this)
    this.settings = {
      global: globalSettings,
      file: fileSettings,
      codeBlock: codeBlockSettings
    }
  }

  get merged(): CodeBlockSettings {
    return { ...this.settings.global, ...this.settings.file, ...this.settings.codeBlock, height: this.height }
  }

  set global(s: GlobalSettings) {
    this.settings.global = s
  }

  set file(s: FileSettings) {
    this.settings.file = s
  }

  get height() {
    return this.newHeight ?? this.settings.codeBlock.height ?? this.DEFAULT_HEIGHT
  }
  set height(height: number) {
    if (height === this.settings.codeBlock.height)
      this.newHeight = undefined
    else
      this.newHeight = height
  }

  saveHeight() {
    if (this.newHeight === undefined) return
    this.updateFrontmatter(settings => {
      settings.height = this.height
    })
    this.newHeight = undefined
  }

  private updateFrontmatter(update: (settings: CodeBlockSettings) => void) {
    const editor = this.tabView.editor
    const sectionInfo = this.__codeBlock.getSectionInfo()
    assert(exists, sectionInfo)
    const lineStart = EditorLine(sectionInfo.lineStart + 1)
    const lineEnd   = EditorLine(sectionInfo.lineEnd)

    const text = editor.getRange(lineStart, lineEnd)

    const gm = GrayMatter(text)
    gm.data.markmap ??= {}
    update(gm.data.markmap)
    isObjectEmpty(gm.data.markmap) && delete gm.data.markmap

    editor.replaceRange(
      GrayMatter.stringify(gm.content, gm.data),
      lineStart, lineEnd
    )
  }
}

const EditorLine = (line: number): EditorPosition => ({ line, ch: 0 })

function SizeManager(containerEl: CodeBlock['containerEl'], svg: SVGSVGElement, settings: SettingsManager) {
  svg.style.height = settings.height + 'px'

  const resizeHandle = document.createElement('hr')
  containerEl.prepend(resizeHandle)
  resizeHandle.classList.add('workspace-leaf-resize-handle')

  const drag$ = dragAndDrop(resizeHandle)

  Callbag.subscribe(drag$, drag => {
    settings.height += drag.changeFromPrevious.y
    svg.style.height = settings.height + 'px'
  })

  Callbag.subscribe(fromEvent(document, 'mouseup'), settings.saveHeight)
}

function SettingsDialog(codeBlock: CodeBlock, tabRow: TabRow, codeBlockSettings: CodeBlockSettings) {
  const fileSettings = new Proxy({} as FileSettings, {
    get: (_, key: keyof FileSettings) => tabRow.file.settings[key],
    has: (_, key) => key in tabRow.file.settings,
    set<Key extends keyof FileSettings>(_: unknown, key: Key, value: FileSettings[Key]) {
      tabRow.file.settings[key] = value
      updateFileFrontmatter()
      return true
    },
    deleteProperty(_, key: keyof FileSettings) {
      delete tabRow.file.settings[key]
      updateFileFrontmatter()
      return true
    }
  })

  function updateFileFrontmatter() {
    const frontmatter = isObjectEmpty(tabRow.file.settings) ? {} : { markmap: tabRow.file.settings }
    tabRow.view.editor.setValue(GrayMatter.stringify(tabRow.file.body, frontmatter))
  }

  const codeBlockProxy = new Proxy(codeBlockSettings, {
    set<Key extends keyof CodeBlockSettings>(_: unknown, key: Key, value: CodeBlockSettings[Key]) {
      codeBlockSettings[key] = value
      updateCodeBlockFrontmatter()
      return true
    },
    deleteProperty(_, key: keyof CodeBlockSettings) {
      delete codeBlockSettings[key]
      updateCodeBlockFrontmatter()
      return true
    }
  })

  function updateCodeBlockFrontmatter() {
    const editor = tabRow.view.editor
    const sectionInfo = codeBlock.getSectionInfo()
    assert(exists, sectionInfo)
    const lineStart = EditorLine(sectionInfo.lineStart + 1)
    const lineEnd   = EditorLine(sectionInfo.lineEnd)

    const text = editor.getRange(lineStart, lineEnd)

    const bodyText = GrayMatter(text).content
    const frontmatter = isObjectEmpty(codeBlockSettings) ? {} : { markmap: codeBlockSettings }

    editor.replaceRange(
      GrayMatter.stringify(bodyText, frontmatter),
      lineStart, lineEnd
    )
  }

  const dialog = new CodeBlockSettingsDialog(fileSettings, codeBlockProxy)

  const button = new ButtonComponent(codeBlock.containerEl.parentElement!)
    .setClass('edit-block-button')
    .setClass('codeblock-settings-button')
    .setIcon('sliders-horizontal')
    .setTooltip('Edit block settings')

  button.onClick(dialog.open)
}
