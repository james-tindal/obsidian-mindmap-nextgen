import { MarkdownPostProcessorContext } from "obsidian";
import { MindMapSettings } from "./settings";
import { Transformer } from "markmap-lib";
import { Markmap, loadCSS, loadJS, deriveOptions } from "markmap-view";
import { IMarkmapJSONOptions, IMarkmapOptions, INode } from "markmap-common";
import { createSVG, getComputedCss } from "./markmap-svg";

type Renderer = (
  settings: MindMapSettings
) => (
  source: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) => void | Promise<any>;

export const inlineRenderer: Renderer =
  (settings: MindMapSettings) =>
  (
    source: string,
    container: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) => {
    try {
      container.style.backgroundColor = "#1e232f";
      container.style.borderColor = "#15171f";
      container.style.borderRadius = "5px";
      container.style.borderWidth = "2px";
      container.style.borderStyle = "solid";
      container.style.padding = "7px";

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

      const { root, features } = transformer.transform(source);
      const frontmatter = ctx.frontmatter as {
        markmap?: IMarkmapJSONOptions;
      };

      const { scripts, styles } = transformer.getUsedAssets(features);

      if (scripts) loadJS(scripts);
      if (styles) loadCSS(styles);

      const frontmatterOptions = deriveOptions(frontmatter?.markmap ?? {});

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
        ...frontmatterOptions,
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
