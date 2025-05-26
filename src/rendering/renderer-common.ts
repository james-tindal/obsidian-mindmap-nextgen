import { loadJS, loadCSS, INode } from 'markmap-common'
import { builtInPlugins, IFeatures, Transformer } from 'markmap-lib'
import { deriveOptions, IMarkmapOptions, Markmap } from 'markmap-view'
import { pick } from 'ramda'
import GrayMatter from 'gray-matter'
import 'markmap-toolbar/dist/style.css'

import { CodeBlockSettings, FileSettings } from 'src/settings/filesystem'
import { parseInternalLinks } from 'src/internal-links/parse-internal-links'
import { embedPlugin } from 'src/embeds/embeds'
import { Toolbar } from 'markmap-toolbar'
import { nextTick } from 'src/utilities/utilities'


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


export function createMarkmap(options: { parent: ParentNode, toolbar: false }): { svg: SVGSVGElement, markmap: Markmap }
export function createMarkmap(options: { parent: ParentNode, toolbar: true }): { svg: SVGSVGElement, markmap: Markmap, toolbar: HTMLDivElement }
export function createMarkmap({ parent, toolbar }: { parent: ParentNode, toolbar: boolean }): any {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const markmap = Markmap.create(svg, {})

  parent.append(svg)
  // wait for markmap to add text to the style element
  nextTick().then(() => {
    const style = markmap.styleNode._groups[0][0] as SVGStyleElement
    const sheet = new Stylesheet(style)
    const rule = sheet.getRule('.markmap')!
    rule.removeProperty('color')
    rule.removeProperty('font')
    rule.removeProperty('--markmap-font')
  })

  if (toolbar) {
    const toolbar = Toolbar.create(markmap)
    toolbar.setBrand(false)
    parent.append(toolbar.el)
    return { svg, markmap, toolbar: toolbar.el }
  }
  else
    return { svg, markmap }
}

class Stylesheet {
  private sheet: CSSStyleSheet
  private rules: CSSRule[]
  constructor(styleElement: SVGStyleElement) {
    this.sheet = styleElement.sheet!
    this.rules = Array.from(this.sheet.cssRules)
  }

  getRule(selector: string) {
    const rule = this.rules.find(rule =>
      rule instanceof CSSStyleRule &&
      rule.selectorText === selector
    ) as CSSStyleRule | undefined

    return rule && new Rule(rule)
  }
}

class Rule {
  constructor(private cssRule: CSSStyleRule) {}

  removeProperty(name: string) {
    this.cssRule.style.removeProperty(name)
  }
}
