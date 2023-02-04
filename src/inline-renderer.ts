import { MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";

import { Transformer } from "markmap-lib";
const transformer = new Transformer();
import { Markmap, deriveOptions } from "markmap-view";
import { IMarkmapJSONOptions, IMarkmapOptions, INode } from "markmap-common";

import { PluginSettings, settingChanges } from "./filesystem";


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
  let frontmatterHighlight: boolean | undefined;
  
  function setupHighlight(_containerDiv: HTMLDivElement, _frontmatterHighlight: boolean | undefined) {
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

  return function handler(markdownContent: string, containerDiv: HTMLDivElement, ctx: MarkdownPostProcessorContext) {
    const child = new MarkdownRenderChild(containerDiv);
    ctx.addChild(child);
    const unlisten = settingChanges.listen("highlight", renderHighlight);
    child.register(unlisten);

    const { root, frontmatter: frontmatter_ } = transformer.transform(markdownContent);
    const frontmatter = frontmatter_ as CustomFrontmatter;
    setupHighlight(containerDiv, frontmatter?.markmap?.highlight);
    renderHighlight();

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
  svg.classList.add("markmap-inline-svg");

  svg.setAttr("style", `--mm-line-height: ${lineHeight ?? "1em"}; width: 100%; height: 100%;`);

  containerDiv.appendChild(svg);

  return svg
}
