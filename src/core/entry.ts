import { App, Plugin as ObsidianPlugin, PluginManifest } from 'obsidian'
import autoBind from 'auto-bind'
import { Source } from 'callbag'

import { FilesystemManager } from 'src/settings/filesystem'
import { GlobalSettingsDialog } from 'src/settings/dialogs'
import { ViewManager } from 'src/views/view-manager'
import { LayoutManager } from 'src/views/layout-manager'
import { loadStyleFeatures } from 'src/rendering/style-features'
import { codeBlockHandler } from 'src/workspace'

export let plugin: Plugin

export default class Plugin extends ObsidianPlugin {
  constructor(_: App, manifest: PluginManifest) {
    console.info('Loading Mindmap plugin')

    super(app, manifest)
    autoBind(this)
    plugin = this

    import('./events')
    import('src/internal-links/handle-internal-links')
    this.setup()
  }

  private async setup() {
    const { settings, createSettingsTab, saveLayout, loadLayout } = await FilesystemManager(this.loadData, this.saveData)
    this.addSettingTab(createSettingsTab(GlobalSettingsDialog))

    const layoutManager = LayoutManager(saveLayout, loadLayout)

    ViewManager(this, settings, layoutManager)

    this.registerMarkdownCodeBlockProcessor('markmap', codeBlockHandler)

    loadStyleFeatures(this)
  }

  public async onunload() {
    console.info('Unloading Mindmap plugin')
  }
}
