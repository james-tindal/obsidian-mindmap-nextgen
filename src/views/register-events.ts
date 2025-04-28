import { debounce } from 'obsidian'
import { eventListeners as listeners } from './event-listeners'
import MindmapTabView from './view'
import { plugin } from 'src/core/entry'
import views from './views'
import Callbag from 'src/utilities/callbag'
import { renderTabs$ } from 'src/rendering/style-features'
import { mmngLayoutReady } from 'src/core/events'


export async function registerEvents() {
  await mmngLayoutReady
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

  Callbag.subscribe(renderTabs$, views.renderAll)
}
