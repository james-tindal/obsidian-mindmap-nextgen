import { MarkdownPostProcessorContext } from "obsidian";

import { Transformer } from "markmap-lib";
const transformer = new Transformer();
import { Markmap, deriveOptions } from "markmap-view";
import { IMarkmapJSONOptions, IMarkmapOptions, INode } from "markmap-common";

import { PluginSettings, toggleBodyClass } from "./filesystem";
import { cssClasses } from "./constants"


toggleBodyClass("highlight", cssClasses.highlight)
app.workspace.on("file-open", async file => {
  file = file!;
  if (file.extension !== "md") return;
  const content = await app.vault.cachedRead(file);

  updateFrontmatterHighlight(content);
})
app.workspace.on("editor-change", (editor, { file }) => {
  file = file!;
  if (file.extension !== "md") return;
  const content = editor.getValue();

  updateFrontmatterHighlight(content);
})

function updateFrontmatterHighlight(content: string) {
  const frontmatter = transformer.transform(content).frontmatter as CustomFrontmatter | undefined;
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

type Handler = (
  markdownContent: string,
  containerDiv: HTMLDivElement,
  ctx: MarkdownPostProcessorContext
) => Promise<any> | void;

type CustomFrontmatter = {
  markmap?: Partial<IMarkmapJSONOptions> & {
    highlight?: boolean;
  };
};

export function inlineRenderer(settings: PluginSettings): Handler {
  return function handler(markdownContent: string, containerDiv: HTMLDivElement, ctx: MarkdownPostProcessorContext) {

    const { root, frontmatter: frontmatter_ } = transformer.transform(markdownContent);
    const frontmatter = frontmatter_ as CustomFrontmatter;

    const markmapOptions = deriveOptions(frontmatter?.markmap ?? {});

    const options: Partial<IMarkmapOptions> = {
      autoFit: false,
      color: applyColor(frontmatter?.markmap?.color, settings),
      duration: 500,
      nodeMinHeight: settings.nodeMinHeight ?? 16,
      spacingVertical: settings.spacingVertical ?? 5,
      spacingHorizontal: settings.spacingHorizontal ?? 80,
      paddingX: settings.paddingX ?? 8,
      embedGlobalCSS: true,
      fitRatio: 1,
      ...markmapOptions,
    };

    const svg = appendSvg(containerDiv, settings.lineHeight);
    renderMarkmap(svg, root, options);
  }
}

function applyColor(frontmatterColors: string[] | undefined, settings: PluginSettings) {
  return ({ depth }: INode) => {
    depth = depth!;
    if (settings.coloring == "single")
      return settings.defaultColor;

    const colors = frontmatterColors?.length
      ? frontmatterColors
      : [settings.depth1Color, settings.depth2Color, settings.depth3Color];

    if (frontmatterColors?.length)
      return colors[depth % colors.length];
    else
      return depth < colors.length ? colors[depth] : settings.defaultColor;
  };
}

function renderMarkmap(
  svg: SVGSVGElement,
  root: INode,
  options: Partial<IMarkmapOptions>,
) {
  const mm = Markmap.create(svg, options);
  mm.setData(root);
  setTimeout(() => mm.fit(), 10);
}

function appendSvg(
  containerDiv: HTMLDivElement,
  lineHeight: string
) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  svg.setAttr("style", `--mm-line-height: ${lineHeight ?? "1em"}`);

  containerDiv.appendChild(svg);

  return svg
}
