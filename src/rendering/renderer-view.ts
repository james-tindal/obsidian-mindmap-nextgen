import { deriveOptions, Markmap } from "markmap-view";
import { ItemView, TFile } from "obsidian";
import { Toolbar } from "markmap-toolbar";
import { IMarkmapJSONOptions, IMarkmapOptions, INode } from "markmap-common";
import { pick } from "ramda";

import { PluginSettings } from "src/filesystem";
import { updateInternalLinks } from "src/rendering/linker";
import { FrontmatterOptions } from "src/types/models";
import { ScreenshotColors, takeScreenshot } from "src/rendering/screenshot";
import readMarkdown from "./renderer-common"



export type Renderer = ReturnType<typeof Renderer>
export function Renderer(containerEl: ItemView["containerEl"], settings: PluginSettings) {
  const { markmap, toolbar } = initialise(containerEl);
  const state: {
    hasRendered: boolean
    frontmatterColors?: ScreenshotColors
    markmapOptions?: Partial<IMarkmapOptions>
  } = {
    hasRendered: false
  };

  return { collapseAll, firstRender, render,
    takeScreenshot: () => takeScreenshot(settings, markmap, state.frontmatterColors!),
    toolbar: {
      get hidden() { return toolbar.hidden},
      toggle: () => 
        toolbar.hidden
        ? toolbar.hidden = false
        : toolbar.hidden = true
    }
  }

  // This relies on firstRender having already happened, so state.markmapOptions is set.
  function collapseAll() {
    markmap.setData(markmap.state.data, {
      ...state.markmapOptions,
      initialExpandLevel: 0,
    });
  }

  async function firstRender(file: TFile) {
    if (state.hasRendered) return;
    state.hasRendered = true;
    await render(file);
    markmap.fit();
  }

  async function render(file: TFile, content?: string) {
    if (!state.hasRendered) return;

    const markdown = content ?? await app.vault.cachedRead(file);
    
    const { root, frontmatter } = readMarkdown(markdown);
    const { titleAsRootNode, markmapOptions } = getOptions(frontmatter);

    if (titleAsRootNode) addTitleToRootNode(root, file.basename);
    updateInternalLinks(root);

    markmap.setData(root, markmapOptions);

    state.markmapOptions = markmapOptions;
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

  function addTitleToRootNode(root: INode, title: string) {
    if (root.content == "") root.content = title;
    else root = { content: title, children: [root], type: 'heading', depth: 0 }
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
  const toolbar = Toolbar.create(markmap) as HTMLDivElement;

  const contentEl = containerEl.children[1];
  contentEl.append(svg, toolbar);

  return { svg, markmap, toolbar };
}
