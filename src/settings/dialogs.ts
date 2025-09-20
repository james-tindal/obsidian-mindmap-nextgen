import { PluginSettingTab, Modal } from 'obsidian'
import autoBind from 'auto-bind'

import { globalSettings, GlobalSettings } from './filesystem'
import { PageSelector } from './components/PageSelector'
import { CodeBlockPage, FilePage, GlobalPage } from './components/pages'
import { plugin } from 'src/core/entry'


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
  constructor(fileSettings: Partial<FileSettings>) {
    super(app)
    autoBind(this)

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
