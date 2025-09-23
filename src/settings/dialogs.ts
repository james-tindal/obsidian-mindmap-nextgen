import { PluginSettingTab, Modal, Editor, getFrontMatterInfo } from 'obsidian'
import autoBind from 'auto-bind'
import * as yaml from 'yaml'

import { globalSettings, GlobalSettings } from './filesystem'
import { PageSelector } from './components/PageSelector'
import { CodeBlockPage, FilePage, GlobalPage } from './components/pages'
import { plugin } from 'src/core/main'


export class GlobalSettingsDialog extends PluginSettingTab {
  constructor() {
    super(app, plugin)

    this.containerEl.addClass('mmng-settings-tab')

    const appendContent =
      PageSelector('global', {
        global: GlobalPage,
        file: FileDoc,
        codeBlock: CodeBlockDoc
      })

    this.display = () => {
      this.containerEl.empty()
      appendContent(this.containerEl)
    }
  }

  public display() {}
}


import { FileSettings } from './filesystem'

export class FileSettingsDialog extends Modal {
  constructor(editor: Editor) {
    super(app)
  
    const fileSettings = createFileSettingsProxy(editor)

    this.containerEl.classList.add('mmng-settings-modal')

    const appendContent =
      PageSelector('file', {
        global: GlobalPage,
        file: FilePage(fileSettings),
        codeBlock: CodeBlockDoc
      })

    this.onClose = () => this.contentEl.empty()
    this.onOpen = () => appendContent(this.contentEl)
  }
}

function createFileSettingsProxy(editor: Editor) {
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


import { CodeBlockSettings } from './filesystem'
import { CodeBlockDoc, FileDoc } from './components/explanations'

export class CodeBlockSettingsDialog extends Modal {
  constructor(fileSettings: Partial<FileSettings>, codeBlockSettings: Partial<CodeBlockSettings>) {
    super(app)
    autoBind(this)

    const inheritSettings = new Proxy({} as GlobalSettings, {
      // When I wrote this, FileSettings was a subset of GlobalSettings
      // not sure exactly what this is supposed to do
      get: (_, key: keyof GlobalSettings) => key in fileSettings ? (fileSettings as any)[key] : globalSettings[key],
      set: () => false
    })

    this.containerEl.classList.add('mmng-settings-modal')

    const appendContent =
      PageSelector('codeBlock', {
        global: GlobalPage,
        file: FilePage(fileSettings),
        codeBlock: CodeBlockPage(inheritSettings, codeBlockSettings)
      })

    this.onClose = () => this.contentEl.empty()
    this.onOpen = () => appendContent(this.contentEl)
  }
}
