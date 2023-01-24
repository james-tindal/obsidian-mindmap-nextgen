import { INode } from "markmap-common";
import { getLinkpath } from "obsidian";

import { INTERNAL_LINK_REGEX } from "./constants";

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
    const isWikiLink = match.groups["wikitext"];
    const linkText = isWikiLink
      ? match.groups["wikitext"]
      : match.groups["mdtext"];
    const linkPath = isWikiLink ? linkText : match.groups["mdpath"];
    if (linkPath.startsWith("http")) {
      continue;
    }
    const vaultName = app.vault.getName();
    const url = `obsidian://open?vault=${vaultName}&file=${
      isWikiLink ? encodeURI(getLinkpath(linkPath)) : linkPath
    }`;
    const link = `<a href=\"${url}\">${linkText}</a>`;
    node.content = node.content.replace(match[0], link);
  }
}

function parseValue(v: string) {
  const matches = [];
  let match;
  while ((match = INTERNAL_LINK_REGEX.exec(v))) {
    matches.push(match);
  }
  return matches;
}

