import { __entry } from './entry'
export const plugin = __entry.plugin

import { createDb } from 'src/workspace/db-schema'

export const svgs = new Map()
export const workspace = createDb()

~(async () => {
  import('./events')
  import('src/internal-links/handle-internal-links')
  await import('src/new/file-settings-button')
  const { settingsLoaded } = await import('src/settings/filesystem')
  await settingsLoaded
  const { loadStyleFeatures } = await import('src/rendering/style-features')
  const { GlobalSettingsDialog } = await import('src/settings/dialogs')
  const { codeBlockHandler } = await import('src/new/codeBlockHandler')

  plugin.addSettingTab(new GlobalSettingsDialog())
  plugin.registerMarkdownCodeBlockProcessor('markmap', codeBlockHandler)
  loadStyleFeatures()
  import('src/workspace')
})()
