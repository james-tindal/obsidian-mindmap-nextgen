import { App, Plugin as ObsidianPlugin, PluginManifest, TFile } from 'obsidian'
import autoBind from 'auto-bind'

import { FilesystemManager, GlobalSettings } from 'src/settings/filesystem'
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
    const { GlobalSettingsDialog } = await import('src/settings/dialogs')
    const { codeBlockHandler } = await import('src/workspace')
    const { ViewManager } = await import('src/views/view-manager')
    const { LayoutManager } = await import('src/views/layout-manager')

    this.addSettingTab(new GlobalSettingsDialog())
    this.registerMarkdownCodeBlockProcessor('markmap', codeBlockHandler)
    const layoutManager = LayoutManager(saveLayout, loadLayout)
    ViewManager(layoutManager)
    loadStyleFeatures()
  }

  public async onunload() {
    console.info('Unloading Mindmap plugin')
  }
}
