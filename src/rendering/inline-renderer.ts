import { ItemView, MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";
import { IFeatures, Transformer } from "markmap-lib";
const transformer = new Transformer();
import { Markmap, deriveOptions } from "markmap-view";
import { IMarkmapJSONOptions, INode, loadCSS, loadJS } from "markmap-common";
import { pick } from "ramda";
import { AsyncReturnType } from "type-fest"

import { settingsReady } from "src/filesystem";
import { cssClasses } from "src/constants";
import { toggleBodyClass } from "src/rendering/style-tools";
import { FrontmatterOptions } from "src/types/models";
import { updateInternalLinks } from "src/rendering/linker";


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

type CustomFrontmatter = {
  markmap?: Partial<IMarkmapJSONOptions> & {
    highlight?: boolean;
  };
};

function InlineRendererManager() {
  const renderers = new Set<InlineRenderer>();

  return { create, renderAll }

  function create(markdown: string, containerDiv: HTMLDivElement, ctx: MarkdownPostProcessorContext) {
    const childComponent = new MarkdownRenderChild(containerDiv);
    ctx.addChild(childComponent);
    InlineRenderer(markdown, containerDiv)
      .then(renderer => {
        renderers.add(renderer);
        childComponent.register(() => renderers.delete(renderer))
      });
  }

  function renderAll() {
    renderers.forEach(renderer => renderer.render())
  }
}
export const inlineRendererManager = InlineRendererManager();

type InlineRenderer = AsyncReturnType<typeof InlineRenderer>;
async function InlineRenderer(markdown: string, containerDiv: HTMLDivElement) {
  const settings = await settingsReady
  const { markmap } = initialise(containerDiv);

  const sanitisedMarkdown = removeUnrecognisedLanguageTags(markdown);
  const { root, frontmatter, features } = transformer.transform(sanitisedMarkdown);
  loadAssets(features);
  updateInternalLinks(root);

  render();

  return { render }

  function render() {
    const { markmapOptions } = getOptions(frontmatter);
    markmap.setData(root, markmapOptions);
    setTimeout(() => markmap.fit(), 100);
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

function loadAssets(features: IFeatures) {
  const { styles, scripts } = transformer.getUsedAssets(features);
  if (scripts) loadJS(scripts);
  if (styles) loadCSS(styles.filter(s =>
    // @ts-expect-error
    !s.data?.href.contains("prismjs") ));
}

function initialise(containerEl: ItemView["containerEl"]) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const markmap = Markmap.create(svg, {});

  containerEl.append(svg);

  return { svg, markmap };
}
