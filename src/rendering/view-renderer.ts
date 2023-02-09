import { deriveOptions, Markmap } from "markmap-view";
import { ItemView, TFile } from "obsidian";
import { Toolbar } from "markmap-toolbar"
import { IMarkmapOptions, INode, loadCSS, loadJS } from "markmap-common";
import { builtInPlugins, Transformer } from "markmap-lib";

import { PluginSettings } from "src/filesystem";
import { updateInternalLinks } from "src/rendering/linker";
import { htmlEscapePlugin, checkBoxPlugin } from "src/plugins";
import { CustomFrontmatter, FrontmatterOptions } from "src/types/models";
import { ScreenshotColors, takeScreenshot } from "src/rendering/screenshot";
import View from "src/views/view";


// There are two structures
// Initial renderer after construct
// Renderer after first render, with more state

export type Renderer = ReturnType<typeof Renderer>
export function Renderer(containerEl: ItemView["containerEl"], settings: PluginSettings, view: View) {
  const { svg, markmap, toolbar } = initialise(containerEl);
  const state: {
    hasRendered: boolean
    frontmatterColors?: ScreenshotColors
    markmapOptions?: Partial<IMarkmapOptions>
    frontmatterOptions?: FrontmatterOptions
  } = {
    hasRendered: false
  };

  return { collapseAll, toggleToolbar, firstRender, render,
    takeScreenshot: () => takeScreenshot(settings, markmap, state.frontmatterColors!)
  }


  function toggleToolbar() {
    toolbar.hidden
    ? toolbar.hidden = false
    : toolbar.hidden = true
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

    const markdown = content ? content : await app.vault.cachedRead(file);

    if (!markdown) return;

    const sanitisedMarkdown = removeUnrecognisedLanguageTags(markdown);

    const transformer = new Transformer([ ...builtInPlugins, htmlEscapePlugin, checkBoxPlugin, ]);

    let { root: root_, frontmatter, features } = transformer.transform(sanitisedMarkdown);
    const { styles, scripts } = transformer.getUsedAssets(features);
    if (scripts) loadJS(scripts);
    if (styles) loadCSS(styles.filter(s =>
      // @ts-expect-error
      !s.data?.href.contains("prismjs") ));

    const actualFrontmatter = frontmatter as CustomFrontmatter;

    const markmapOptions = deriveOptions(frontmatter?.markmap);

    const frontmatterOptions = state.frontmatterOptions = {
      ...markmapOptions,
      screenshotTextColor: actualFrontmatter?.markmap?.screenshotTextColor,
      screenshotBgColor: actualFrontmatter?.markmap?.screenshotBgColor,
      titleAsRootNode: actualFrontmatter?.markmap?.titleAsRootNode
    };

    const titleAsRootNode =
      typeof frontmatterOptions.titleAsRootNode === 'boolean'
      ? frontmatterOptions.titleAsRootNode
      : settings.titleAsRootNode;

    const root = titleAsRootNode ? addTitleToRootNode(root_, file.basename) : root_;
    updateInternalLinks(root);

    const computedColor = getComputedStyle(containerEl).getPropertyValue("--text-normal");

    if (computedColor) {
      svg.setAttr(
        "style",
        `--mm-line-height: ${settings.lineHeight ?? "1em"};`
      );
    }

    const options: Partial<IMarkmapOptions> = {
      autoFit: false,
      nodeMinHeight: settings.nodeMinHeight ?? 16,
      spacingVertical: settings.spacingVertical ?? 5,
      spacingHorizontal: settings.spacingHorizontal ?? 80,
      paddingX: settings.paddingX ?? 8,
      embedGlobalCSS: true,
      fitRatio: 1,
      initialExpandLevel: settings.initialExpandLevel ?? -1,
      maxWidth: settings.maxWidth ?? 0,
      duration: settings.animationDuration ?? 500,
    };

    const coloring = settings.coloring

    if (coloring === "depth")
      options.color =
        depthColoring(frontmatter?.markmap?.color);
    if (coloring === "single")
      options.color =
        () => settings.defaultColor;

    state.markmapOptions = options;

    markmap.setData(root, {
      ...options,
      ...markmapOptions,
    });
  }

  function removeUnrecognisedLanguageTags(markdown: string) {
    // Remove info string from code fence unless it in the list of default languages from
    // https://prismjs.com/#supported-languages
    const allowedLanguages = ["markup", "html", "xml", "svg", "mathml", "ssml", "atom", "rss", "js", "javascript", "css", "clike"]
    return markdown.replace(/```(.+)/g, (_, capture) => {
      const backticks = capture.match(/(`*).*/)?.[1]
      const infoString = capture.match(/`*(.*)/)?.[1]
      const t = infoString?.trim()
      const sanitisedInfoString = allowedLanguages.includes(t) ? t : ""
      return "```" + (backticks || "") + sanitisedInfoString
    })
  }

  function addTitleToRootNode(root: INode, title: string) {
    if (root.content == "") return { ...root, content: title }
    return { content: title, children: [root], type: 'heading', depth: 0 }
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