import { ITransformPlugin } from 'markmap-lib'
import { EmbedInfo, MarkdownRenderer, parseLinktext, TFile } from 'obsidian'

import { plugin } from 'src/core/entry'
import { getActiveFile } from 'src/views/get-active-file'
import MindmapView from 'src/views/view'
import views from 'src/views/views'


export const embedPlugin: ITransformPlugin = {
  name: 'obsidian-embed',
  transform(hooks) {
    hooks.parser.tap(md => {
      md.inline.ruler.before('emphasis', 'obsidian_embed', (state, silent) => {
        const { matched, length, linkText } = parseMain(state.src.slice(state.pos))
        if (!matched) return false
        if (silent) return true

        const token = state.push('obsidian_embed', 'obsidian-embed', 0)
        token.attrSet('linkText', linkText)

        state.pos += length
        return true
      })

      md.renderer.rules.obsidian_embed = (tokens, idx) => {
        const token = tokens[idx]
        const attrs = (token.attrs || [])
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ')
        
        return `<obsidian-embed ${attrs}></obsidian-embed>`
      }
    })

    return {}
  }
}

function parseMain(str: string) {
  const match = 
    /^!\[\[(?<linkText>.+)]]/
      .exec(str)

  const linkText = match?.groups?.linkText
  if (!match || !linkText)
    return {
      matched: false as const
    }

  return {
    matched: true as const,
    length: match[0].length,
    linkText
  }
}


class EmbedElement extends HTMLElement {
  static observedAttributes = ['linkText']

	async connectedCallback() {
    const linkText = this.getAttribute('linkText')
    if (!linkText) throw new Error('obsidian-embed component must have a linkText attribute')

    const sourcePath = getSourcePath(this)

    await MarkdownRenderer.renderMarkdown(`![[${linkText}]]`, this, sourcePath, plugin)

    // replace custom element with render output
    const embedContainer = this.children[0].children[0]
    this.replaceWith(embedContainer)

    const src = embedContainer.getAttribute('src')!
    const { path, subpath } = parseLinktext(src)

    deleteText(embedContainer)

    const file = app.metadataCache.getFirstLinkpathDest(path, sourcePath)
    if (!(file instanceof TFile)) {
      const el = createDiv('file-not-found')
      el.innerText = `File not found: ${path}`
      embedContainer.append(el)
      return
    }

    if (file.extension === 'md' && subpath === '') {
      const title = createDiv('embed-title markdown-embed-title')
      title.innerText = file.basename
      embedContainer.append(title)
    }

    const embedInfo: EmbedInfo = {
      app,
      containerEl: embedContainer as HTMLDivElement,
      depth: 1,
      displayMode: false,
      linktext: src,
      showInline: false,
      sourcePath
    }
    const embedCreator = app.embedRegistry.embedByExtension[file.extension]
    const embedComponent = embedCreator(embedInfo, file, subpath)
    embedComponent.loadFile()
	}
}
customElements.define('obsidian-embed', EmbedElement)


function deleteText(parent: ParentNode) {
  for (const node of Array.from(parent.childNodes))
    if (node.nodeType === Node.TEXT_NODE)
      parent.removeChild(node)
}

function getSourcePath(embedElement: EmbedElement) {
  const leafElement = embedElement.closest('.workspace-leaf')
  const view =
    MindmapView.instances.find(view =>
      view.leaf.containerEl === leafElement)
  if (!view) throw new Error('Couldn\'t get view')
  const subject = views.get(view)
  if (!subject) throw new Error('Couldn\'t get subject')
  const file =
    subject !== 'unpinned'
    ? subject
    : getActiveFile()
  if (!file) throw new Error('Couldn\'t get file')

  return file.path
}
