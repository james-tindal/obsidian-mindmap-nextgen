import { App, Plugin as ObsidianPlugin, PluginManifest } from 'obsidian'
import autoBind from 'auto-bind'

import { createDb } from 'src/workspace/db-schema'


export let plugin: Plugin
export const svgs = new Map()
export const workspace = createDb()


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
    const { settingsLoaded } = await import('src/settings/filesystem')
    await settingsLoaded
    const { loadStyleFeatures } = await import('src/rendering/style-features')
    const { GlobalSettingsDialog } = await import('src/settings/dialogs')
    const { codeBlockHandler } = await import('src/new/codeBlockHandler')

    this.addSettingTab(new GlobalSettingsDialog())
    this.registerMarkdownCodeBlockProcessor('markmap', codeBlockHandler)
    loadStyleFeatures()
    import('src/workspace')
  }

  public async onunload() {
    console.info('Unloading Mindmap plugin')
  }
}
