import { eventListeners as listeners } from './event-listeners'
import MindmapTabView from './view'
import views from './views'


export async function registerEvents() {
  MindmapTabView.onPinToggle(view => {
    const subject = views.get(view)!
    if (subject === 'unpinned')
      listeners.viewRequest['menu-pin']()
    else
      listeners.viewRequest['menu-unpin'](subject)
  })
}
