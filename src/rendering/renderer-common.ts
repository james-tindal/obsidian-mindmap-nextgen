import { loadJS, loadCSS } from "markmap-common";
import { builtInPlugins, IFeatures, Transformer } from "markmap-lib";
import { htmlEscapePlugin, checkBoxPlugin } from "src/plugins";
import { updateInternalLinks } from "./linker";
export const transformer = new Transformer([ ...builtInPlugins, htmlEscapePlugin, checkBoxPlugin ]);



export default function readMarkdown(markdown: string) {
  const sanitisedMarkdown = removeUnrecognisedLanguageTags(markdown);
    
  const { root, frontmatter, features } = transformer.transform(sanitisedMarkdown);
  loadAssets(features);
  updateInternalLinks(root);

  return { root, frontmatter }
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