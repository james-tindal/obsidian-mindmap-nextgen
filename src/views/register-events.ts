import { debounce } from 'obsidian'
import { EventListeners } from './event-listeners'
import MindmapTabView from './view'
import { ViewCreatorManager } from './view-creator-manager'
import { plugin } from 'src/core/entry'
import views from './views'

export async function registerEvents(listeners: EventListeners, setViewCreator: ViewCreatorManager['setViewCreator']) {
  listeners.appLoading(setViewCreator)
  const mindmapLayoutReady = new Promise(resolve =>
    app.workspace.onLayoutReady(() =>
      listeners.layoutReady().then(resolve)
    ))

  await mindmapLayoutReady
  listeners.layoutChange()

  plugin.registerEvent(app.workspace.on('layout-change', listeners.layoutChange))

  ;[
    app.workspace.on('editor-change', debounce(listeners.editorChange, 300, true)),
    app.workspace.on('file-open', listeners.fileOpen),
    app.vault.on('rename', listeners.renameFile)
  ]
  .forEach(listener => plugin.registerEvent(listener))

  MindmapTabView.onPinToggle(view => {
    const subject = views.get(view)!
    if (subject === 'unpinned')
      listeners.viewRequest['menu-pin']()
    else
      listeners.viewRequest['menu-unpin'](subject)
  })

  plugin.addCommand({
    id: 'mindmapnextgen:unpinned',
    name: 'Open unpinned mindmap',
    callback: listeners.viewRequest['hotkey-open-unpinned'],
    hotkeys: [],
  })

  plugin.addCommand({
    id: 'mindmapnextgen:pinned',
    name: 'Open pinned mindmap',
    callback: listeners.viewRequest['hotkey-open-pinned'],
    hotkeys: [],
  })
}
