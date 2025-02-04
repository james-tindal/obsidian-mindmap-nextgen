import { PluginSettingTab, Modal } from 'obsidian'
import autoBind from 'auto-bind'

import Plugin from 'src/core/entry'
import { GlobalSettings } from './filesystem'
import { PageSelector } from './components/PageSelector'
import { CodeBlockPage, FilePage, GlobalPage } from './components/pages'


export class GlobalSettingsDialog extends PluginSettingTab {
  constructor(settings: GlobalSettings) {
    super(app, Plugin.instance)

    this.containerEl.addClass('mmng-settings-tab')

    const appendContent =
      PageSelector('global', {
        global: GlobalPage(settings),
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
  constructor(globalSettings: GlobalSettings, fileSettings: Partial<FileSettings>) {
    super(app)
    autoBind(this)

    this.containerEl.classList.add('mmng-settings-modal')

    const appendContent =
      PageSelector('file', {
        global: GlobalPage(globalSettings),
        file: FilePage(globalSettings, fileSettings),
        codeBlock: CodeBlockDoc
      })

    this.onClose = () => this.contentEl.empty()
    this.onOpen = () => appendContent(this.contentEl)
  }
}


import { CodeBlockSettings } from './filesystem'
import { CodeBlockDoc, FileDoc } from './components/explanations'

export class CodeBlockSettingsDialog extends Modal {
  constructor(globalSettings: GlobalSettings, fileSettings: Partial<FileSettings>, codeBlockSettings: Partial<CodeBlockSettings>) {
    super(app)
    autoBind(this)

    const inheritSettings = new Proxy({} as GlobalSettings, {
      get: (_, key) => fileSettings[key] || globalSettings[key],
      set: () => false
    })

    this.containerEl.classList.add('mmng-settings-modal')

    const appendContent =
      PageSelector('codeBlock', {
        global: GlobalPage(globalSettings),
        file: FilePage(globalSettings, fileSettings),
        codeBlock: CodeBlockPage(inheritSettings, codeBlockSettings)
      })

    this.onClose = () => this.contentEl.empty()
    this.onOpen = () => appendContent(this.contentEl)
  }
}
