import { loadJS, loadCSS, IMarkmapOptions, INode } from "markmap-common";
import { builtInPlugins, IFeatures, Transformer } from "markmap-lib";
import { deriveOptions } from "markmap-view"
import { pick } from "ramda"
import GrayMatter from "gray-matter"

import { CodeBlockSettings, FileSettings } from "src/settings/filesystem"
import { htmlEscapePlugin, checkBoxPlugin } from "src/plugins";
import { updateInternalLinks } from "./internal-links";
export const transformer = new Transformer([ ...builtInPlugins, htmlEscapePlugin, checkBoxPlugin ]);


export function parseMarkdown<Type extends "file" | "codeBlock">(text: string) {
  const gm = GrayMatter(text)
  const content = removeUnrecognisedLanguageTags(gm.content)
  const frontmatter = gm.data
    
  const { root, features } = transformer.transform(content)
  loadAssets(features)
  updateInternalLinks(root)

  const settings = (frontmatter?.markmap || {}) as Type extends "file" ? FileSettings : CodeBlockSettings

  return { rootNode: root, settings }
}

export function removeUnrecognisedLanguageTags(markdown: string) {
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

export function loadAssets(features: IFeatures) {
  const { styles, scripts } = transformer.getUsedAssets(features);
  if (scripts) loadJS(scripts);
  if (styles) loadCSS(styles.filter(s =>
    // @ts-expect-error
    !s.data?.href.contains("prismjs") ));
}

export function getOptions(settings: CodeBlockSettings): Partial<IMarkmapOptions> {
  // Use colors from global settings:
  // const { color: branchColoring } = deriveOptions({ ...settings, color: settings.color?.length ? settings.color : [settings.depth1Color, settings.depth2Color, settings.depth3Color] })

  const { color: branchColoring } = deriveOptions(pick(["color", "colorFreezeLevel"], settings))
  const colorFn = {
    branch: branchColoring,
    depth: depthColoring(settings),
    single: () => settings.defaultColor
  }[settings.coloring]

  return {
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
    ...colorFn && { color: colorFn }
  }
}

function depthColoring(settings: CodeBlockSettings) {
  return ({ depth }: INode) => {
    depth = depth!

    if (settings.color?.length)
      return settings.color[depth % settings.color.length]

    const colors = [settings.depth1Color, settings.depth2Color, settings.depth3Color]

    return depth < 3
      ? colors[depth]
      : settings.defaultColor
  }
}
