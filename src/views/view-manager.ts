import { LayoutManager } from './layout-manager'
import { EventListeners } from './event-listeners'
import { registerEvents } from './register-events'
import { renderTabs$ } from 'src/rendering/style-features'
import Callbag from 'src/utilities/callbag'
import views from './views'


export function ViewManager(layoutManager: LayoutManager) {
  const eventListeners = EventListeners(layoutManager)

  registerEvents(eventListeners)

  Callbag.subscribe(renderTabs$, views.renderAll)
}
