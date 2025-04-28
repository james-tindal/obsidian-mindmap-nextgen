import { registerEvents } from './register-events'
import { renderTabs$ } from 'src/rendering/style-features'
import Callbag from 'src/utilities/callbag'
import views from './views'


export function ViewManager() {
  registerEvents()

  Callbag.subscribe(renderTabs$, views.renderAll)
}
