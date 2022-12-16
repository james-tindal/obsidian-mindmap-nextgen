import { MarkdownPostProcessorContext } from "obsidian";
import { MindMapSettings } from "./settings";
import { Transformer } from "markmap-lib";
import { Markmap, loadCSS, loadJS, deriveOptions } from "markmap-view";
import { IMarkmapJSONOptions, IMarkmapOptions, INode } from "markmap-common";
import { getComputedCss } from "./markmap-svg";
import { FrontmatterOptions } from "./@types/models";

type Renderer = (
  settings: MindMapSettings
) => (
  source: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) => void | Promise<any>;

type CustomFrontmatter = {
  markmap: Partial<IMarkmapJSONOptions> & {
    screenshotFgColor?: string;
    highlightInlineMarkmap?: boolean;
  };
};

export const inlineRenderer: Renderer =
  (settings) => (source, container, ctx) => {
    try {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.id = `markmap-${Math.ceil(Math.random() * 10000)}`;

      const style = document.createElement("style");

      const { color } = getComputedCss(container);
      style.innerHTML = `#${svg.id} div {
          color: ${color};
          line-height: ${settings.lineHeight ?? "1em"};
      }

      #${svg.id} {
        width: 100%;
      }
      `;
      svg.appendChild(style);
      container.appendChild(svg);

      const transformer = new Transformer();

      const { root, features, frontmatter } = transformer.transform(source);

      const actualFrontmatter = frontmatter as CustomFrontmatter;

      const derivedFrontmatter = deriveOptions(frontmatter?.markmap ?? {});

      const frontmatterOptions: FrontmatterOptions = {
        ...derivedFrontmatter,
        highlightInlineMarkmap:
          actualFrontmatter?.markmap?.highlightInlineMarkmap,
        screenshotFgColor: actualFrontmatter?.markmap?.screenshotFgColor,
      };

      let shouldHighlight: boolean = false;
      console.log(
        frontmatterOptions,
        frontmatterOptions.highlightInlineMarkmap
      );
      if (frontmatterOptions.highlightInlineMarkmap !== undefined) {
        if (frontmatterOptions.highlightInlineMarkmap) shouldHighlight = true;
      } else if (settings.highlightInlineMarkmap) {
        shouldHighlight = settings.highlightInlineMarkmap;
      }

      if (shouldHighlight) {
        container.style.backgroundColor = "#1e232f";
        container.style.borderColor = "#15171f";
        container.style.borderRadius = "5px";
        container.style.borderWidth = "2px";
        container.style.borderStyle = "solid";
        container.style.padding = "7px";
      } else {
        container.style.backgroundColor = "transparent";
        container.style.borderColor = "transparent";
        container.style.borderRadius = "0px";
        container.style.borderWidth = "0px";
        container.style.borderStyle = "none";
        container.style.padding = "0px";
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
        ...derivedFrontmatter,
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
