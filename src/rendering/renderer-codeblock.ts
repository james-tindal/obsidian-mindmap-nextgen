import { Component, Editor, EditorPosition, setIcon, setTooltip, TFile } from 'obsidian'
import type { Markmap } from 'markmap-view'
import autoBind from 'auto-bind'
import GrayMatter from 'gray-matter'

import { CodeBlockSettings, FileSettings, globalSettings, GlobalSettings } from 'src/settings/filesystem'
import { cssClasses } from 'src/constants'
import { assert, isObjectEmpty, notNullish } from 'src/utilities/utilities'
import { createMarkmap, getOptions, transformMarkdown, splitMarkdown } from 'src/rendering/renderer-common'
import { renderCodeblocks$ } from 'src/rendering/style-features'
import Callbag, { dragAndDrop, fromEvent } from 'src/utilities/callbag'
import { CodeBlockSettingsDialog } from 'src/settings/dialogs'
import { CodeBlock } from 'src/new/codeBlockHandler'
import { svgs } from 'src/internal-links/handle-internal-links'
import { strings } from 'src/translation'


export type CodeBlockRenderer = ReturnType<typeof CodeBlockRenderer>
export function CodeBlockRenderer(codeBlock: CodeBlock) {
  const { component, containerEl, markdownView, editor, file } = codeBlock

  // createMarkmap should take the full markdown and render
  // transformMarkdown should be merged into this
  const { markmap, svg } = createMarkmap({ parent: containerEl, toolbar: false })

  if (file)
    svgs.register(component, svg, file)

  const fileSettings: FileSettings = editor
    ? splitMarkdown('file', editor.getValue()).settings
    : getFileSettingsFromCache(file)
  const { settings: codeBlockSettings, body } = splitMarkdown('codeBlock', codeBlock.markdown)
  const rootNode = transformMarkdown(codeBlock.markdown)
  const settings = new SettingsManager(codeBlock, fileSettings, codeBlockSettings)

  SizeManager(containerEl, svg, settings, { editable: editor !== undefined })

  if (markdownView?.getMode() === 'source' && editor)
    SettingsDialog(codeBlock, body, codeBlockSettings, fileSettings, editor)

  render().then(() => {
    // Blocks without an editor (embeds, canvas cards) can render before their
    // container has its final size, which makes fit() compute a wrong scale.
    if (editor) {
      try { markmap.fit() }
      catch {}
    } else {
      refitOnResize(markmap, svg, component)
    }
  })

  Callbag.subscribe(renderCodeblocks$, render)

  function render() {
    const markmapOptions = getOptions(settings.merged)
    const promise = markmap.setData(rootNode, markmapOptions)

    const { classList } = containerEl.parentElement!
    settings.merged.highlight
      ? classList.add   (cssClasses.highlight)
      : classList.remove(cssClasses.highlight)

    return promise
  }
}

// Read file-level markmap settings without an editor (embeds / canvas cards)
function getFileSettingsFromCache(file: TFile | undefined) {
  if (!file) return {} as FileSettings
  return (app.metadataCache.getFileCache(file)?.frontmatter?.markmap ?? {}) as FileSettings
}

// fit() measures the live container; embeds and canvas cards may not be laid
// out yet at first render, so re-fit (debounced) until the size settles.
function refitOnResize(markmap: Markmap, svg: SVGSVGElement, component: Component) {
  const fit = () => {
    // Canvas cards live under a transformed ancestor, so the rendered rect
    // reflects canvas zoom instead of the box size; fit by layout size so the
    // mindmap fills its box and scales with the canvas like an image.
    if (!svg.clientWidth || !svg.clientHeight) return
    const originalGetRect = svg.getBoundingClientRect
    svg.getBoundingClientRect = () => {
      const rect = originalGetRect.call(svg)
      return new DOMRect(rect.x, rect.y, svg.clientWidth, svg.clientHeight)
    }
    try { markmap.fit() }
    finally { svg.getBoundingClientRect = originalGetRect }
  }

  let lastWidth = -1
  let lastHeight = -1
  let timer: ReturnType<typeof setTimeout> | undefined

  const observer = new ResizeObserver(() => {
    const { width, height } = svg.getBoundingClientRect()
    if (width === lastWidth && height === lastHeight) return
    lastWidth = width
    lastHeight = height
    if (timer) clearTimeout(timer)
    timer = setTimeout(fit, 200)
  })

  observer.observe(svg)
  component.register(() => {
    observer.disconnect()
    if (timer) clearTimeout(timer)
  })
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
    private codeBlock: CodeBlock,
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
    const editor = this.codeBlock.editor
    const sectionInfo = this.codeBlock.getSectionInfo()
    assert(notNullish, sectionInfo)
    assert(notNullish, editor)
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

function SizeManager(containerEl: CodeBlock['containerEl'], svg: SVGSVGElement, settings: SettingsManager, { editable }: { editable: boolean }) {
  svg.style.height = settings.height + 'px'

  if (!editable) return

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

function SettingsDialog(codeBlock: CodeBlock, body: string, codeBlockSettings: CodeBlockSettings, fileSettings: FileSettings, editor: Editor) {
  const fileSettingsProxy = new Proxy({} as FileSettings, {
    get: (_, key: keyof FileSettings) => fileSettings[key],
    has: (_, key) => key in fileSettings,
    set<Key extends keyof FileSettings>(_: unknown, key: Key, value: FileSettings[Key]) {
      fileSettings[key] = value
      updateFileFrontmatter()
      return true
    },
    deleteProperty(_, key: keyof FileSettings) {
      delete fileSettings[key]
      updateFileFrontmatter()
      return true
    }
  })

  function updateFileFrontmatter() {
    const frontmatter = isObjectEmpty(fileSettings) ? {} : { markmap: fileSettings }
    editor.setValue(GrayMatter.stringify(body, frontmatter))
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
    const sectionInfo = codeBlock.getSectionInfo()
    assert(notNullish, sectionInfo)
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

  queueMicrotask(() => {
    const embedActions = codeBlock.containerEl.parentElement!
      .querySelector<HTMLElement>(':scope > .embed-actions')
    assert(notNullish, embedActions)

    const action = createDiv('embed-action edit-block-button')
    setIcon(action, 'sliders-horizontal')
    setTooltip(action, strings.blockSettingsButton)
    action.addEventListener('click', () =>
      new CodeBlockSettingsDialog(fileSettingsProxy, codeBlockProxy).open())

    embedActions.prepend(action)
  })
}
