import { LayoutManager } from './layout-manager'
import { EventListeners } from './event-listeners'
import { registerEvents } from './register-events'
import { ViewCreatorManager } from './view-creator-manager'
import { LeafManager } from './leaf-manager'
import { renderTabs$ } from 'src/rendering/style-features'
import Callbag from 'src/utilities/callbag'
import views from './views'


export function ViewManager(layoutManager: LayoutManager) {
  const viewCreatorManager = new ViewCreatorManager()
  const leafManager = LeafManager(viewCreatorManager.constructView)
  const eventListeners = EventListeners(layoutManager, leafManager)

  registerEvents(eventListeners, viewCreatorManager.setViewCreator)

  Callbag.subscribe(renderTabs$, views.renderAll)
}
