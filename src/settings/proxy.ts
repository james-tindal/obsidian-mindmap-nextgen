import { Editor, getFrontMatterInfo } from 'obsidian'
import * as yaml from 'yaml'

import { splitMarkdown } from 'src/rendering/renderer-common'

export function createSettingsProxy<Type extends 'file' | 'codeBlock'>(type: Type, editor: Editor) {
  const markdown = editor.getValue()
  const { settings } = splitMarkdown(type, markdown)

  const persist = (() => {
    const markdown = editor.getValue()
    const { exists, frontmatter, ...info } = getFrontMatterInfo(markdown)
    const doc = yaml.parseDocument(frontmatter)
    const from = editor.offsetToPos(info.from)
    const to = editor.offsetToPos(info.to)
    const _persist = () => {
      const output = exists ? doc.toString() : `---\n${doc.toString()}\n---\n`
      editor.replaceRange(output, from, to)
    }
    const set: yaml.Document['setIn'] = (path, value) => {
      doc.setIn(path, value)
      _persist()
    }
    const delete_: yaml.Document['deleteIn'] = path => {
      const ret = doc.deleteIn(path)
      _persist()
      return ret
    }
    return { set, delete: delete_ }
  })()

  return new Proxy(settings, { 
    set(_, key, value) {
      persist.set(['markmap', key], value)
      return true
    },
    deleteProperty(_, key) {
      return persist.delete(['markmap', key])
    },
  })
}
