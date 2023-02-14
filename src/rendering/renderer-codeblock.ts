import { ItemView, parseYaml } from "obsidian";
import { Markmap, deriveOptions } from "markmap-view";
import { INode } from "markmap-common";
import { pick } from "ramda";

import { CodeBlockSettings, FileSettings, GlobalSettings } from "src/filesystem";
import { cssClasses, FRONT_MATTER_REGEX } from "src/constants";
import { CodeBlock } from "src/workspace/types"
import { toggleBodyClass } from "src/rendering/style-tools";
import readMarkdown from "src/rendering/renderer-common";
import { renderCodeblocks$ } from "src/rendering/style-features"
import Callbag from "src/utilities/callbag"


type Frontmatter = Partial<{
  markmap: Partial<{
    highlight: boolean;
  }>
}>

function getFrontmatter(fileContent: string) {
  const str = FRONT_MATTER_REGEX.exec(fileContent)?.[0].slice(4, -4);
  return str && parseYaml(str)
}

toggleBodyClass("highlight", cssClasses.highlight)
app.workspace.on("file-open", file =>
  file?.extension === 'md' &&
  app.vault.read(file).then(getFrontmatter).then(updateFrontmatterHighlight))
app.workspace.on("editor-change", (editor, { file }) =>
  file?.extension === 'md' &&
  updateFrontmatterHighlight(getFrontmatter(editor.getValue())))


async function updateFrontmatterHighlight(frontmatter: Frontmatter | null) {
  const highlight = frontmatter?.markmap?.highlight;
  const classList = app.workspace.activeLeaf!.containerEl.parentElement!.classList;

  if (typeof highlight !== 'boolean') {
    classList.remove(cssClasses.highlight)
    classList.remove(cssClasses.highlightOff) }
  if (highlight === true) {
    classList.add(cssClasses.highlight)
    classList.remove(cssClasses.highlightOff) }
  if (highlight === false) {
    classList.add(cssClasses.highlightOff)
    classList.remove(cssClasses.highlight) }
}



export type CodeBlockRenderer = ReturnType<typeof CodeBlockRenderer>;
export function CodeBlockRenderer(codeBlock: CodeBlock, globalSettings: GlobalSettings, fileSettings: FileSettings) {

  // * Combine 3 settings objects
  // * 

  const { markdown, containerEl } = codeBlock;

  const { markmap } = initialise(containerEl);

  const settings = { globalSettings, fileSettings }

  const { rootNode, settings: codeBlockSettings } = readMarkdown<CodeBlock>(markdown);

  let hasFit = false
  function fit() {
    if (!hasFit) markmap.fit()
  }

  render();
  Callbag.subscribe(renderCodeblocks$, render);

  return { render, fit, updateGlobalSettings, updateFileSettings }

  function updateGlobalSettings(globalSettings: GlobalSettings) {
    settings.globalSettings = globalSettings
    render()
  }

  function updateFileSettings(fileSettings: FileSettings) {
    settings.fileSettings = fileSettings
    render()
  }

  function render() {
    const { markmapOptions } = getOptions(codeBlockSettings);
    markmap.setData(rootNode, markmapOptions);
  }

  function getOptions(codeBlockSettings: CodeBlockSettings) {
    const titleAsRootNode =
      "titleAsRootNode" in codeBlockSettings
      ? codeBlockSettings.titleAsRootNode
      : globalSettings.titleAsRootNode;

      // console.log(deriveOptions({ colorFreezeLevel: globalSettings.colorFreezeLevel, ...codeBlockSettings }))
  
    const options = {
      autoFit: false,
      embedGlobalCSS: true,
      fitRatio: 1,
      duration: globalSettings.animationDuration,
      ...pick([
        "initialExpandLevel",
        "maxWidth",
        "nodeMinHeight",
        "paddingX",
        "spacingVertical",
        "spacingHorizontal",
      ], globalSettings),
      ...deriveOptions({ colorFreezeLevel: globalSettings.colorFreezeLevel, ...codeBlockSettings })
    };
  
    const coloring = globalSettings.coloring
  
    if (coloring === "depth")
      options.color =
        depthColoring(codeBlockSettings?.color);
    if (coloring === "single")
      options.color =
        () => globalSettings.defaultColor;
    
    return { titleAsRootNode, markmapOptions: options }
  }

  function depthColoring(frontmatterColors?: string[]) {
    return ({ depth }: INode) => {
      depth = depth!;
      if (frontmatterColors?.length)
        return frontmatterColors[depth % frontmatterColors.length]

      const colors = [globalSettings.depth1Color, globalSettings.depth2Color, globalSettings.depth3Color];

      return depth < 3 ?
        colors[depth] :
        globalSettings.defaultColor
    };
  }
}

function initialise(containerEl: ItemView["containerEl"]) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const markmap = Markmap.create(svg, {});

  containerEl.append(svg);

  return { svg, markmap };
}
