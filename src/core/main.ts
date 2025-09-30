import { __entry } from './entry'
import Callbag from 'src/utilities/callbag'
import { iife } from 'src/utilities/utilities'


export const plugin = __entry.plugin
export const svgs = new Map()

iife(async () => {
  import('./events')
  import('src/internal-links/handle-internal-links')
  await import('src/new/file-settings-button')
  const { settingsLoaded } = await import('src/settings/filesystem')
  await settingsLoaded
  const { loadStyleFeatures } = await import('src/rendering/style-features')
  const { GlobalSettingsDialog } = await import('src/settings/dialogs')
  const { codeBlockCreated } = await import('src/new/codeBlockHandler')
  const { CodeBlockRenderer } = await import('src/rendering/renderer-codeblock')
  Callbag.subscribe(codeBlockCreated, CodeBlockRenderer)

  plugin.addSettingTab(new GlobalSettingsDialog())
  loadStyleFeatures()
})
