import { INode } from "markmap-common";
import { getLinkpath } from "obsidian";

import { INTERNAL_LINK_REGEX } from "src/constants";

export function updateInternalLinks(node: INode) {
  replaceInternalLinks(node);
  if (node.children) {
    node.children.forEach(updateInternalLinks);
  }
}

function replaceInternalLinks(node: INode) {
  const matches = parseValue(node.content);
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const isWikiLink = match.groups!["wikitext"];
    var linkText = isWikiLink
      ? match.groups!["wikitext"]
      : match.groups!["mdtext"];
    var linkPath = isWikiLink ? linkText : match.groups!["mdpath"];
    if (linkPath.startsWith("http")) {
      continue;
    }
    const vaultName = app.vault.getName();
    //const url = `obsidian://open?vault=${vaultName}&file=${isWikiLink ? encodeURI(getLinkpath(linkPath)) : linkPath}`;
    var url = "";
    if(isWikiLink){
      //"&": [[A & B]]
      linkPath = linkPath.replace(/&amp;/g, "&");
      //"|": [[A & B|AB]]
      const regex = /^(.*?)\|(.*)$/;
      const match_link_text = regex.exec(linkPath);
      if(match_link_text && match_link_text.length === 3){
        linkText = match_link_text[2];
        linkPath = match_link_text[1].trim();
      }
      url = `obsidian://open?vault=${vaultName}&file=${encodeURIComponent(getLinkpath(linkPath))}`;
    }
    else{
      //"&": [AB](<A & B.md>)
      linkPath = linkPath.replace(/&amp;/g, "%26");
      url = `obsidian://open?vault=${vaultName}&file=${linkPath}`;
    }    
    const link = `<a href=\"${url}\">${linkText}</a>`;
    node.content = node.content.replace(match[0], link);
  }
}

function parseValue(v: string) {
  const matches: any[] = [];
  let match;
  while ((match = INTERNAL_LINK_REGEX.exec(v))) {
    matches.push(match);
  }
  return matches;
}

