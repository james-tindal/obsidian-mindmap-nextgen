import { deriveOptions, Markmap } from "markmap-view";
import { ItemView, TFile } from "obsidian";
import { Toolbar } from "markmap-toolbar";
import { IMarkmapOptions, INode } from "markmap-common";
import { pick } from "ramda";

import { FileSettings, GlobalSettings } from "src/filesystem";
import { updateInternalLinks } from "src/rendering/linker";
import { ScreenshotColors, takeScreenshot } from "src/rendering/screenshot";
import readMarkdown from "./renderer-common"



export type TabRenderer = ReturnType<typeof TabRenderer>
export function TabRenderer(containerEl: ItemView["containerEl"], globalSettings: GlobalSettings) {
  const { markmap, toolbar } = initialise(containerEl);
  const state: {
    hasRendered: boolean
    frontmatterColors?: ScreenshotColors
    markmapOptions?: Partial<IMarkmapOptions>
  } = {
    hasRendered: false
  };

  return { collapseAll, firstRender, render,
    takeScreenshot: () => takeScreenshot(globalSettings, markmap, state.frontmatterColors!),
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
    
    const { rootNode, settings: fileSettings } = readMarkdown<TFile>(markdown);
    const { titleAsRootNode, markmapOptions } = getOptions(fileSettings);

    if (titleAsRootNode) addTitleToRootNode(rootNode, file.basename);
    updateInternalLinks(rootNode);

    markmap.setData(rootNode, markmapOptions);

    state.markmapOptions = markmapOptions;
  }

  function getOptions(fileSettings: FileSettings) {
    const titleAsRootNode =
      "titleAsRootNode" in fileSettings
      ? fileSettings.titleAsRootNode
      : globalSettings.titleAsRootNode;

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
      ...deriveOptions({ colorFreezeLevel: globalSettings.colorFreezeLevel, ...fileSettings })
    };

    const coloring = globalSettings.coloring

    if (coloring === "depth")
      options.color =
        depthColoring(fileSettings.color);
    if (coloring === "single")
      options.color =
        () => globalSettings.defaultColor;
    
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
  const toolbar = Toolbar.create(markmap) as HTMLDivElement;

  const contentEl = containerEl.children[1];
  contentEl.append(svg, toolbar);

  return { svg, markmap, toolbar };
}
