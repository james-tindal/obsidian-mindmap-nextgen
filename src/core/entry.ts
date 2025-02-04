import { App, Plugin as ObsidianPlugin, PluginManifest } from 'obsidian'
import autoBind from 'auto-bind'
import { Source } from 'callbag'

import { FilesystemManager } from 'src/settings/filesystem'
import { GlobalSettingsDialog } from 'src/settings/dialogs'
import { ViewManager } from 'src/views/view-manager'
import { LayoutManager } from 'src/views/layout-manager'
import { loadStyleFeatures } from 'src/rendering/style-features'
import { codeBlockHandler } from 'src/workspace'
import { catchInternalLinks } from 'src/internal-links/catch-internal-links'
import Callbag from 'src/utilities/callbag'


export default class Plugin extends ObsidianPlugin {
  public static instance: Plugin
  public static stream: Source<Plugin>

  constructor(_: App, manifest: PluginManifest) {
    super(app, manifest)
    autoBind(this)
    Plugin.instance = this
    Plugin.stream = Callbag.pipe(
      Callbag.create(next => next(this)),
      Callbag.remember
    )
    console.info('Loading Mindmap plugin')

    this.setup()
  }

  private async setup() {
    const { settings, createSettingsTab, saveLayout, loadLayout } = await FilesystemManager(this.loadData, this.saveData)
    this.addSettingTab(createSettingsTab(GlobalSettingsDialog))

    const layoutManager = LayoutManager(saveLayout, loadLayout)

    ViewManager(this, settings, layoutManager)

    this.registerMarkdownCodeBlockProcessor('markmap', codeBlockHandler)

    loadStyleFeatures(this)

    catchInternalLinks(this)
  }

  public async onunload() {
    console.info('Unloading Mindmap plugin')
  }
}
