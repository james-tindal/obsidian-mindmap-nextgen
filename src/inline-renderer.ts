import { MarkdownPostProcessorContext } from "obsidian";

import { Transformer } from "markmap-lib";
import { Markmap, loadCSS, loadJS, deriveOptions } from "markmap-view";
import { IMarkmapJSONOptions, IMarkmapOptions, INode } from "markmap-common";

import { getComputedCss } from "./markmap-svg";

type Renderer = (
  settings: MindMapSettings
) => (
  source: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) => void | Promise<any>;

type CustomFrontmatter = {
  markmap: Partial<IMarkmapJSONOptions> & {
    highlight?: boolean;
  };
};

export const inlineRenderer: Renderer =
  (settings) => (source, container, _) => {
    try {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.classList.add("markmap-inline-svg");

      const style = document.createElement("style");

      svg.setAttr(
        "style",
        `--mm-line-height: ${
          settings.lineHeight ?? "1em"
        }; width: 100%; height: 100%;`
      );

      svg.appendChild(style);
      container.appendChild(svg);

      const transformer = new Transformer();

      const { root, features, frontmatter } = transformer.transform(source);

      const actualFrontmatter = frontmatter as CustomFrontmatter;

      const markmapFrontmatter = deriveOptions(frontmatter?.markmap ?? {});

      const frontmatterOptions: Partial<FrontmatterOptions> = {
        ...markmapFrontmatter,
        highlight: actualFrontmatter?.markmap?.highlight,
      };

      let shouldHighlight: boolean = false;
      if (frontmatterOptions.highlight !== undefined) {
        if (frontmatterOptions.highlight) shouldHighlight = true;
      } else if (settings.highlight) {
        shouldHighlight = settings.highlight;
      }

      if (shouldHighlight) {
        container.classList.remove("markmap-inline-container_unboxed");
        container.classList.add("markmap-inline-container_boxed");
      } else {
        container.classList.remove("markmap-inline-container_boxed");
        container.classList.add("markmap-inline-container_unboxed");
      }

      const { scripts, styles } = transformer.getUsedAssets(features);

      if (scripts) loadJS(scripts);
      if (styles) loadCSS(styles);

      const { font } = getComputedCss(container);

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
        ...markmapFrontmatter,
      };

      const mm = Markmap.create(svg, { ...options });
      mm.setData(root);
      setTimeout(() => mm.fit(), 10);
    } catch (e) {
      console.log("error");
    }
  };

function applyColor(frontmatterColors: string[], settings: MindMapSettings) {
  return ({ depth }: INode) => {
    if (settings.onlyUseDefaultColor) return settings.defaultColor;

    const colors = frontmatterColors?.length
      ? frontmatterColors
      : [settings.color1, settings.color2, settings.color3];

    if (frontmatterColors?.length) return colors[depth % colors.length];
    else return depth < colors.length ? colors[depth] : settings.defaultColor;
  };
}
