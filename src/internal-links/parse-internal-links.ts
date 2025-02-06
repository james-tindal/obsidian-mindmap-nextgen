import { IPureNode } from 'markmap-common'


const recurseChildren = (fn: (node: IPureNode) => void) => (node: IPureNode) => {
  fn(node)
  node.children?.forEach(recurseChildren(fn))
}

function* matchRegex(str: string, regex: RegExp) {
  while (true) {
    const match = regex.exec(str)
    if (!match) break
    yield match
  }
}

function replaceMatches(str: string, regex: RegExp, replacer: (match: RegExpExecArray) => string) {
  let accumulator = str
  const matches = matchRegex(str, regex)
  for (const match of matches)
    accumulator = accumulator.replace(match[0], replacer(match))
  return accumulator
}


const wikilinkRegex = /\[\[(?<link>[^|\]]+)\|?((?<displayText>[^\]]+))?\]\]/g

function replacement(match) {
  const { link, displayText } = match.groups!
  return `<a href=\"${link}\">${displayText || link}</a>`
}

export const parseInternalLinks = recurseChildren(node => {
  node.content =
    replaceMatches(node.content, wikilinkRegex, replacement)
})
