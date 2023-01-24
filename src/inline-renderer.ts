import { MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";

import { Transformer } from "markmap-lib";
const transformer = new Transformer();
import { Markmap, loadCSS, loadJS, deriveOptions } from "markmap-view";
import { IMarkmapJSONOptions, IMarkmapOptions, INode } from "markmap-common";

import { getComputedCss } from "./markmap-svg";
import { PluginSettings, settingChanges } from "./filesystem-data";
import { dontPanic } from "./utilities"


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
  let containerDiv: HTMLDivElement;
  let frontmatterHighlight: boolean;
  
  function setupHighlight(_containerDiv: HTMLDivElement, _frontmatterHighlight: boolean) {
    containerDiv = _containerDiv;
    frontmatterHighlight = _frontmatterHighlight;
  }

  function renderHighlight() {
    const shouldHighlight = frontmatterHighlight ?? settings.highlight;
    if (shouldHighlight) {
      containerDiv.classList.remove("markmap-inline-container_unboxed");
      containerDiv.classList.add("markmap-inline-container_boxed");
    } else {
      containerDiv.classList.remove("markmap-inline-container_boxed");
      containerDiv.classList.add("markmap-inline-container_unboxed");
    }
  }

  function handler(markdownContent: string, containerDiv: HTMLDivElement, ctx: MarkdownPostProcessorContext) {
    const child = new MarkdownRenderChild(containerDiv);
    ctx.addChild(child);
    const unlisten = settingChanges.listen("highlight", renderHighlight);
    child.register(unlisten);

    const { root, features, frontmatter: frontmatter_ } = transformer.transform(markdownContent);
    const frontmatter = frontmatter_ as CustomFrontmatter;
    setupHighlight(containerDiv, frontmatter?.markmap?.highlight);
    renderHighlight();

    const { scripts, styles } = transformer.getUsedAssets(features);

    if (scripts) loadJS(scripts);
    if (styles) loadCSS(styles);

    const { font } = getComputedCss(containerDiv);
    const markmapOptions = deriveOptions(frontmatter?.markmap ?? {});

    const options: Partial<IMarkmapOptions> = {
      autoFit: false,
      color: applyColor(frontmatter?.markmap?.color, settings),
      duration: 500,
      style: (id) => `${id} * {font: ${font}}`,
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
  return dontPanic(handler, 'Error in inline renderer');
}

function applyColor(frontmatterColors: string[], settings: PluginSettings) {
  return ({ depth }: INode) => {
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
  svg.classList.add("markmap-inline-svg");

  const style = document.createElement("style");

  svg.setAttr("style", `--mm-line-height: ${lineHeight ?? "1em"}; width: 100%; height: 100%;`);

  svg.appendChild(style);
  containerDiv.appendChild(svg);

  return svg
}
