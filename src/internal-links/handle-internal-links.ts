import { plugin, svgs } from 'src/core/entry'


const workspace = document.querySelector('.workspace' as 'div')!

const registerEvent = (type: 'click' | 'mouseover', fn: (args: {
  event: MouseEvent
  target: HTMLAnchorElement
  parentMindmap: SVGSVGElement
  href: string
}) => void) =>
  plugin.registerDomEvent(workspace, type, event => {
    const { target } = event
    const isAnchor = target instanceof HTMLAnchorElement
      if (!isAnchor) return
    const parentMindmap = target.closest('svg.markmap' as 'svg')
      if (!parentMindmap) return
    const href = target.getAttribute('href')
      if (!href) return
    const hasProtocol = /^[^#:]*:.*#/.test(href)  // https://regex101.com/r/RLG0a5/1
      if (hasProtocol) return

    fn({ event, target, parentMindmap, href })
  })

registerEvent('click', ({ event, parentMindmap, href }) => {
  event.preventDefault()

  const { path } = svgs.get(parentMindmap)!
  app.workspace.openLinkText(href, path)
})

plugin.registerHoverLinkSource('mindmap-nextgen', {
  display: 'Mindmap Nextgen',
  defaultMod: true
})

registerEvent('mouseover', ({ event, target, parentMindmap, href }) => {
  app.workspace.trigger('hover-link', {
    event,
    source: 'mindmap-nextgen',
    hoverParent: parentMindmap,
    targetEl: target,
    linktext: href
  })
})
