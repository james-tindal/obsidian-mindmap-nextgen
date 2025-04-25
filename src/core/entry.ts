import { App, Plugin as ObsidianPlugin, PluginManifest, TFile } from 'obsidian'
import autoBind from 'auto-bind'

import { FilesystemManager, GlobalSettings } from 'src/settings/filesystem'
import { GlobalSettingsDialog } from 'src/settings/dialogs'
import { ViewManager } from 'src/views/view-manager'
import { LayoutManager } from 'src/views/layout-manager'
import { loadStyleFeatures } from 'src/rendering/style-features'
import { createDb, Database } from 'src/workspace/db-schema'

export let plugin: Plugin
export const pluginState = {} as PluginState
interface PluginState {
  svgs: Map<SVGSVGElement, TFile>
  settings: GlobalSettings
  workspace: Database
}
pluginState.svgs = new Map()
pluginState.workspace = createDb()


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
    const { settings, saveLayout, loadLayout } = await FilesystemManager(this.loadData, this.saveData)
    pluginState.settings = settings
    this.addSettingTab(new GlobalSettingsDialog())

    const { codeBlockHandler } = await import('src/workspace')
    this.registerMarkdownCodeBlockProcessor('markmap', codeBlockHandler)

    const layoutManager = LayoutManager(saveLayout, loadLayout)

    ViewManager(this, settings, layoutManager)

    loadStyleFeatures()
  }

  public async onunload() {
    console.info('Unloading Mindmap plugin')
  }
}
