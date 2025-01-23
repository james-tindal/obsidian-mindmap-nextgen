import { INode } from 'markmap-common'


export function updateInternalLinks(node: INode) {
  replaceInternalLinks(node)
  if (node.children) {
    node.children.forEach(updateInternalLinks)
  }
}

function replaceInternalLinks(node: INode) {
  const matches = matchRegex(node.content)
  for (const match of matches) {
    const { link, displayText } = match.groups!
    const html = `<a href=\"${link}\">${displayText || link}</a>`
    node.content = node.content.replace(match[0], html)
  }
}

const wikilinkRegex = /\[\[(?<link>[^|\]]+)\|?((?<displayText>.+))?\]\]/g
function* matchRegex(str: string) {
  while (true) {
    const match = wikilinkRegex.exec(str)
    if (!match) break
    yield match
  }
}
