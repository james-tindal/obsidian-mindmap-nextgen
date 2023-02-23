import { ItemView, parseYaml } from "obsidian";
import { Markmap, deriveOptions } from "markmap-view";
import { IMarkmapJSONOptions, INode } from "markmap-common";
import { pick } from "ramda";

import { PluginSettings } from "src/filesystem";
import { cssClasses, FRONT_MATTER_REGEX } from "src/constants";
import { toggleBodyClass } from "src/rendering/style-tools";
import { FrontmatterOptions } from "src/types/models";
import readMarkdown from "./renderer-common";


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


export type InlineRenderer = ReturnType<typeof InlineRenderer>;
export function InlineRenderer(markdown: string, containerEl: HTMLDivElement, settings: PluginSettings) {
  const { markmap } = initialise(containerEl);

  const { root, frontmatter } = readMarkdown(markdown);
  let hasFit = false;

  render();

  return { render, fit, containerEl }

  function fit() {
    if (hasFit) return;
    markmap.fit();
    hasFit = true;
  }

  function render() {
    const { markmapOptions } = getOptions(frontmatter);
    markmap.setData(root, markmapOptions);
  }

  function getOptions(frontmatter?: { markmap?: IMarkmapJSONOptions }) {
    const frontmatterOptions = (frontmatter?.markmap || {}) as FrontmatterOptions;
  
    const titleAsRootNode =
      "titleAsRootNode" in frontmatterOptions
      ? frontmatterOptions.titleAsRootNode
      : settings.titleAsRootNode;
  
    const options = {
      autoFit: false,
      embedGlobalCSS: true,
      fitRatio: 1,
      duration: settings.animationDuration,
      ...pick([
        "initialExpandLevel",
        "maxWidth",
        "nodeMinHeight",
        "paddingX",
        "spacingVertical",
        "spacingHorizontal",
      ], settings),
      ...deriveOptions({ colorFreezeLevel: settings.colorFreezeLevel, ...frontmatter?.markmap })
    };
  
    const coloring = settings.coloring
  
    if (coloring === "depth")
      options.color =
        depthColoring(frontmatter?.markmap?.color);
    if (coloring === "single")
      options.color =
        () => settings.defaultColor;
    
    return { titleAsRootNode, markmapOptions: options }
  }

  function depthColoring(frontmatterColors?: string[]) {
    return ({ depth }: INode) => {
      depth = depth!;
      if (frontmatterColors?.length)
        return frontmatterColors[depth % frontmatterColors.length]

      const colors = [settings.depth1Color, settings.depth2Color, settings.depth3Color];

      return depth < 3 ?
        colors[depth] :
        settings.defaultColor
    };
  }
}

function initialise(containerEl: ItemView["containerEl"]) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const markmap = Markmap.create(svg, {});

  containerEl.append(svg);

  return { svg, markmap };
}
