import { INode } from 'markmap-common'
import { getLinkpath } from 'obsidian'


export function updateInternalLinks(node: INode) {
  replaceInternalLinks(node)
  if (node.children) {
    node.children.forEach(updateInternalLinks)
  }
}

function replaceInternalLinks(node: INode) {
  const matches = matchRegex(node.content)
  for (const match of matches) {
    const isWikiLink = match.groups!['wikitext']
    let linkText = isWikiLink
      ? match.groups!['wikitext']
      : match.groups!['mdtext']
    let linkPath = isWikiLink ? linkText : match.groups!['mdpath']
    if (linkPath.startsWith('http')) {
      continue
    }
    const vaultName = app.vault.getName()
    let url = ''
    if (isWikiLink) {
      // "&": [[A & B]]
      linkPath = linkPath.replace(/&amp;/g, '&')
      // "|": [[A & B|AB]]
      const regex = /^(.*?)\|(.*)$/
      const match_link_text = regex.exec(linkPath)
      if (match_link_text && match_link_text.length === 3) {
        linkText = match_link_text[2]
        linkPath = match_link_text[1].trim()
      }
      url = `obsidian://open?vault=${vaultName}&file=${encodeURIComponent(getLinkpath(linkPath))}`
    } else {
      // "&": [AB](<A & B.md>)
      linkPath = linkPath.replace(/&amp;/g, '%26')
      url = `obsidian://open?vault=${vaultName}&file=${linkPath}`
    }    
    const link = `<a href=\"${url}\">${linkText}</a>`
    node.content = node.content.replace(match[0], link)
  }
}

// https://regex101.com/r/gw85cc/2
const regex = /\[\[(?<wikitext>.*)\]\]|<a href="(?<mdpath>.*)">(?<mdtext>.*)<\/a>/gim

function* matchRegex(str: string) {
  while (true) {
    const match = regex.exec(str)
    if (!match) break
    yield match
  }
}
