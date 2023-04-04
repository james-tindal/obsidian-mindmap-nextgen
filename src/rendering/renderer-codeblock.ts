import { Markmap } from "markmap-view";

import { CodeBlockSettings, FileSettings, GlobalSettings } from "src/filesystem";
import { cssClasses } from "src/constants";
import { CodeBlock } from "src/workspace/types"
import readMarkdown, { getOptions } from "src/rendering/renderer-common";
import { renderCodeblocks$ } from "src/rendering/style-features"
import Callbag from "src/utilities/callbag"


export type CodeBlockRenderer = ReturnType<typeof CodeBlockRenderer>;
export function CodeBlockRenderer(codeBlock: CodeBlock, globalSettings: GlobalSettings, fileSettings: FileSettings) {

  const { markdown, containerEl } = codeBlock;

  const { markmap } = initialise(containerEl);

  const { rootNode, settings: codeBlockSettings } = readMarkdown<CodeBlock>(markdown);

  const settings = {
    global: globalSettings,
    file: fileSettings,
    codeBlock: codeBlockSettings,
    get merged(): CodeBlockSettings {
      return { ...settings.global, ...settings.file, ...settings.codeBlock }
    }
  }

  let hasFit = false
  function fit() {
    if (!hasFit) markmap.fit()
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

function initialise(containerEl: CodeBlock["containerEl"]) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const markmap = Markmap.create(svg, {});

  containerEl.append(svg);

  return { svg, markmap };
}
