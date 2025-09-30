import { Editor, getFrontMatterInfo } from 'obsidian'
import yaml from 'yaml'
import { FileSettings } from './filesystem'

export function createFileSettingsProxy(editor: Editor) {
  const markdown = editor.getValue()
  const { frontmatter } = getFrontMatterInfo(markdown)
  const parsed = yaml.parse(frontmatter) ?? {}
  const fileSettings = ('markmap' in parsed ? parsed.markmap : {}) as FileSettings

  const persist = (() => {
    const markdown = editor.getValue()
    const { exists, frontmatter, ...info} = getFrontMatterInfo(markdown)
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

  return new Proxy(fileSettings, { 
    set<Key extends keyof FileSettings>(_: unknown, key: Key, value: FileSettings[Key]) {
      persist.set(['markmap', key], value)
      return true
    },
    deleteProperty(_: unknown, key: keyof FileSettings) {
      return persist.delete(['markmap', key])
    },
  })
}
