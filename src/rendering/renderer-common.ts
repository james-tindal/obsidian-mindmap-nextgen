import { loadJS, loadCSS, INode } from 'markmap-common'
import { builtInPlugins, IFeatures, Transformer } from 'markmap-lib'
import { deriveOptions, globalCSS, IMarkmapOptions, Markmap } from 'markmap-view'
import { Toolbar } from 'markmap-toolbar'
import { pick } from 'ramda'
import * as yaml from 'yaml'
import 'markmap-toolbar/dist/style.css'

import { CodeBlockSettings, FileSettings } from 'src/settings/filesystem'
import { parseInternalLinks } from 'src/internal-links/parse-internal-links'
import { embedPlugin } from 'src/embeds/embeds'
import { nextTick } from 'src/utilities/utilities'
import { getFrontMatterInfo } from 'obsidian'


const styleEl = createEl('style', {
  parent: document.head,
  text: globalCSS
})
nextTick().then(() => {
  const sheet = new Stylesheet(styleEl)
  const rule = sheet.getRule('.markmap')!
  rule.removeProperty('color')
  rule.removeProperty('font')
})


export const transformer = new Transformer([ ...builtInPlugins, embedPlugin ])

export function transformMarkdown(markdown: string) {
  const { root, features } = transformer.transform(markdown)
  loadAssets(features)
  parseInternalLinks(root)
  return root
}

export function splitMarkdown<Type extends 'file' | 'codeBlock'>(type: Type, markdown: string) {
  const { frontmatter, contentStart } = getFrontMatterInfo(markdown)
  const body = markdown.slice(0, contentStart)
  const parsed = yaml.parse(frontmatter) ?? {}
  type Settings =
    Type extends 'file' ? FileSettings : CodeBlockSettings
  const settings = ('markmap' in parsed ? parsed.markmap : {}) as Settings
  return { body, settings }
}

export function loadAssets(features: IFeatures) {
  const { styles, scripts } = transformer.getUsedAssets(features)
  if (scripts) loadJS(scripts)
  if (styles) loadCSS(styles.filter(s =>
    // @ts-expect-error
    !s.data?.href.contains('@highlightjs') ))
}

export function getOptions(settings: CodeBlockSettings): Partial<IMarkmapOptions> {
  const { color: branchColoring } = deriveOptions(pick(['color', 'colorFreezeLevel'], settings))
  const colorFn = {
    branch: branchColoring,
    depth: depthColoring(settings),
    single: () => settings.defaultColor
  }[settings.coloring]

  return {
    autoFit: false,
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
  const markmap = Markmap.create(svg, { embedGlobalCSS: false })
  parent.append(svg)

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
  constructor(styleElement: HTMLStyleElement) {
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
