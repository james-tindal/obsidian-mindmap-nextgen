import { Markmap } from "markmap-view";
import { ButtonComponent, EditorPosition } from "obsidian"
import autoBind from "auto-bind"
import GrayMatter from "gray-matter"

import { CodeBlockSettings, FileSettings, GlobalSettings } from "src/settings/filesystem";
import { cssClasses } from "src/constants";
import { CodeBlock, FileTab } from "src/workspace/types"
import { getOptions, parseMarkdown } from "src/rendering/renderer-common"
import { renderCodeblocks$ } from "src/rendering/style-features"
import Callbag, { flatMap, fromEvent, map, pairwise, takeUntil } from "src/utilities/callbag"
import { CodeBlockSettingsDialog } from "src/settings/dialog-codeblock"


export type CodeBlockRenderer = ReturnType<typeof CodeBlockRenderer>;
export function CodeBlockRenderer(codeBlock: CodeBlock, tabView: FileTab.View, globalSettings: GlobalSettings, fileSettings: FileSettings) {

  const { markdown, containerEl } = codeBlock;

  const { markmap, svg } = createMarkmap(containerEl)

  const { rootNode, settings: codeBlockSettings } = parseMarkdown<"codeBlock">(markdown)

  const settings = new SettingsManager(tabView, codeBlock, {
    global: globalSettings,
    file: fileSettings,
    codeBlock: codeBlockSettings,
  })

  SizeManager(containerEl, svg, settings)

  if (tabView.getMode() === "source")
    SettingsDialog(containerEl, settings)

  let hasFit = false
  function fit() {
    if (!hasFit) markmap.fit()
    hasFit = true
  }

  render();
  Callbag.subscribe(renderCodeblocks$, render);

  return { render, fit, updateGlobalSettings, updateFileSettings }

  function updateGlobalSettings(globalSettings: GlobalSettings) {
    settings.global = globalSettings
    render()
  }

  function updateFileSettings(fileSettings: FileSettings) {
    settings.file = fileSettings
    render()
  }

  function render() {
    const markmapOptions = getOptions(settings.merged)
    markmap.setData(rootNode, markmapOptions);

    const { classList } = containerEl.parentElement!
    settings.merged.highlight
      ? classList.add   (cssClasses.highlight)
      : classList.remove(cssClasses.highlight)
  }
}

function createMarkmap(containerEl: CodeBlock["containerEl"]) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const markmap = Markmap.create(svg, {});

  containerEl.append(svg);

  return { svg, markmap };
}


class SettingsManager {
  private newHeight: number | undefined
  private readonly DEFAULT_HEIGHT = 150

  constructor(
    private tabView: FileTab.View,
    private codeBlock: CodeBlock,
    private settings: { global: GlobalSettings, file: FileSettings, codeBlock: CodeBlockSettings }
  ) {
    autoBind(this)
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

  proxy = new Proxy(this.merged, {
    get: (_, key) =>
      this.merged[key],
    set: (_, key: string, value) => {
      this.settings.codeBlock[key] = value
      this.updateFrontmatter(settings => settings[key] = value)
      return true
    }
  })

  private updateFrontmatter(update: (settings: CodeBlockSettings) => void) {
    const editor = this.tabView.editor
    const sectionInfo = this.codeBlock.getSectionInfo()
    const lineStart = EditorLine(sectionInfo.lineStart + 1)
    const lineEnd   = EditorLine(sectionInfo.lineEnd)

    const text = editor.getRange(lineStart, lineEnd)

    const gm = GrayMatter(text)
    gm.data.markmap ??= {}
    update(gm.data.markmap)

    editor.replaceRange(
      GrayMatter.stringify(gm.content, gm.data),
      lineStart, lineEnd
    )
  }
}

const EditorLine = (line: number): EditorPosition => ({ line, ch: 0 })

function SizeManager(containerEl: CodeBlock["containerEl"], svg: SVGSVGElement, settings: SettingsManager) {
  svg.style.height = settings.height + "px"

  const resizeHandle = document.createElement("hr")
  containerEl.prepend(resizeHandle)
  resizeHandle.classList.add("workspace-leaf-resize-handle")

  const yOffset$ = Callbag.pipe(
    fromEvent(resizeHandle, "mousedown"),
    map(ev => ev.clientY),
    flatMap(startY => Callbag.pipe(
      fromEvent(document, "mousemove"),
      map(ev => (ev.preventDefault(), ev.clientY - startY)),
      takeUntil(fromEvent(document, "mouseup")),
      pairwise,
      map(([a, b]) => b - a),
    ))
  )

  Callbag.subscribe(yOffset$, offset => {
    settings.height += offset
    svg.style.height = settings.height + "px"
  })

  Callbag.subscribe(fromEvent(document, "mouseup"), settings.saveHeight)
}

function SettingsDialog(containerEl: CodeBlock["containerEl"], sm: SettingsManager) {
  const dialog = new CodeBlockSettingsDialog(sm.proxy)

  const button = new ButtonComponent(containerEl.parentElement!)
    .setClass("edit-block-button")
    .setClass("codeblock-settings-button")
    .setIcon("sliders-horizontal")
    .setTooltip("Edit block settings")

  button.onClick(dialog.open)
}
