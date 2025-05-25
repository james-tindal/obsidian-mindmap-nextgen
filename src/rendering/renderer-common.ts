import { loadJS, loadCSS, INode } from 'markmap-common'
import { builtInPlugins, IFeatures, Transformer } from 'markmap-lib'
import { deriveOptions, IMarkmapOptions } from 'markmap-view'
import { pick } from 'ramda'
import GrayMatter from 'gray-matter'

import { CodeBlockSettings, FileSettings } from 'src/settings/filesystem'
import { parseInternalLinks } from 'src/internal-links/parse-internal-links'
import { embedPlugin } from 'src/embeds/embeds'


export const transformer = new Transformer([ ...builtInPlugins, embedPlugin ])

export function parseMarkdown<Type extends 'file' | 'codeBlock'>(text: string) {
  ;(GrayMatter as typeof GrayMatter & { clearCache: Function }).clearCache()
  const gm = GrayMatter(text)
  const frontmatter = gm.data
  
  const { root, features } = transformer.transform(gm.content)
  loadAssets(features)
  parseInternalLinks(root)

  const settings = (frontmatter?.markmap || {}) as Type extends 'file' ? FileSettings : CodeBlockSettings

  return { rootNode: root, settings, body: gm.content }
}

export function loadAssets(features: IFeatures) {
  const { styles, scripts } = transformer.getUsedAssets(features)
  if (scripts) loadJS(scripts)
  if (styles) loadCSS(styles.filter(s =>
    // @ts-expect-error
    !s.data?.href.contains('@highlightjs') ))
}

export function getOptions(settings: CodeBlockSettings): Partial<IMarkmapOptions> {
  // Use colors from global settings:
  // const { color: branchColoring } = deriveOptions({ ...settings, color: settings.color?.length ? settings.color : [settings.depth1Color, settings.depth2Color, settings.depth3Color] })

  const { color: branchColoring } = deriveOptions(pick(['color', 'colorFreezeLevel'], settings))
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
      'initialExpandLevel',
      'maxWidth',
      'nodeMinHeight',
      'paddingX',
      'spacingVertical',
      'spacingHorizontal',
    ], settings),
    ...colorFn && { color: colorFn }
  }
}

export function depthColoring(settings: CodeBlockSettings) {
  return ({ state: { depth }}: INode) => {
    if (settings.color?.length)
      return settings.color[depth % settings.color.length]

    const colors = [settings.depth1Color, settings.depth2Color, settings.depth3Color]

    return depth <= 3
      ? colors[depth - 1]
      : settings.defaultColor
  }
}
