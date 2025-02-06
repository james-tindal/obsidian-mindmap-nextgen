import { plugin } from 'src/core/entry'
import { pluginState } from 'src/core/state'


const workspace = document.querySelector('.workspace' as 'div')!

plugin.registerDomEvent(workspace, 'click', event => {
  const { target } = event
  const isAnchor = target instanceof HTMLAnchorElement
    if (!isAnchor) return
  const parentMindmap = target.closest('svg.markmap' as 'svg')
    if (!parentMindmap) return
  const href = target.getAttribute('href')
    if (!href) return
  const hasProtocol = /^[^#:]*:.*#/.test(href)  // https://regex101.com/r/RLG0a5/1
    if (hasProtocol) return

  event.preventDefault()

  const { path } = pluginState.svgs.get(parentMindmap)!
  app.workspace.openLinkText(href, path)
})
