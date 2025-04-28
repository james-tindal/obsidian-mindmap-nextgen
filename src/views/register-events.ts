import { debounce } from 'obsidian'
import { eventListeners as listeners } from './event-listeners'
import MindmapTabView from './view'
import { plugin } from 'src/core/entry'
import views from './views'


export async function registerEvents() {
  plugin.registerEvent(
    app.workspace.on('editor-change', debounce(listeners.editorChange, 300, true)))

  MindmapTabView.onPinToggle(view => {
    const subject = views.get(view)!
    if (subject === 'unpinned')
      listeners.viewRequest['menu-pin']()
    else
      listeners.viewRequest['menu-unpin'](subject)
  })
}
