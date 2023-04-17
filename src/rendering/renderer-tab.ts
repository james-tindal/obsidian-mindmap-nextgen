import { Markmap } from "markmap-view"
import { TFile } from "obsidian";
import { Toolbar } from "markmap-toolbar";
import { IMarkmapOptions, INode } from "markmap-common";

import { FileSettings, GlobalSettings } from "src/settings/filesystem";
import { updateInternalLinks } from "src/rendering/internal-links";
import { ScreenshotColors, takeScreenshot } from "src/rendering/screenshot";
import readMarkdown, { getOptions } from "./renderer-common"
import { MindmapTab } from "src/workspace/types"



export type TabRenderer = ReturnType<typeof TabRenderer>
export function TabRenderer(containerEl: MindmapTab.View["containerEl"], globalSettings: GlobalSettings) {
  const { markmap, toolbar } = initialise(containerEl);
  const state: {
    hasRendered: boolean
    screenshotColors?: ScreenshotColors
    markmapOptions?: Partial<IMarkmapOptions>
  } = {
    hasRendered: false
  };

  return { collapseAll, firstRender, render,
    takeScreenshot: () => takeScreenshot(globalSettings, markmap, state.screenshotColors!),
    toolbar: {
      get hidden() { return toolbar.hidden },
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
    const settings: FileSettings = { ...globalSettings, ...fileSettings }
    const markmapOptions = getOptions(settings);

    if (settings.titleAsRootNode)
      addTitleToRootNode(rootNode, file.basename);
    updateInternalLinks(rootNode);

    markmap.setData(rootNode, markmapOptions);

    state.markmapOptions = markmapOptions;
  }

  function addTitleToRootNode(root: INode, title: string) {
    if (root.content == "") root.content = title;
    else root = { content: title, children: [root], type: 'heading', depth: 0 }
  }
}

function initialise(containerEl: MindmapTab.View["containerEl"]) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const markmap = Markmap.create(svg, {});
  const toolbar = Toolbar.create(markmap) as HTMLDivElement;

  const contentEl = containerEl.children[1];
  contentEl.append(svg, toolbar);

  return { svg, markmap, toolbar };
}
