import { Component, TFile } from 'obsidian'
import { plugin } from 'src/core/main'


export function registerInternalLinks(component: Component, svg: SVGSVGElement, getFile: () => TFile | undefined) {
  svg.addEventListener('click', handleEvent)
  svg.addEventListener('mouseover', handleEvent)
  component.register(() => {
    svg.removeEventListener('click', handleEvent)
    svg.removeEventListener('mouseover', handleEvent)
  })

  function handleEvent(event: MouseEvent) {
    const { target } = event
    if (!(target instanceof HTMLAnchorElement)) return
    if (target.closest('svg.markmap') !== svg) return
    const href = target.getAttribute('href')
    if (!href) return
    const hasProtocol = /^[^#:]*:.*#/.test(href)  // https://regex101.com/r/RLG0a5/1
    if (hasProtocol) return

    if (event.type === 'click') {
      event.preventDefault()
      const file = getFile()
      if (!file) return
      app.workspace.openLinkText(href, file.path)
    } else {
      app.workspace.trigger('hover-link', {
        event,
        source: 'mindmap-nextgen',
        hoverParent: svg,
        targetEl: target,
        linktext: href
      })
    }
  }
}

plugin.registerHoverLinkSource('mindmap-nextgen', {
  display: 'Mindmap Nextgen',
  defaultMod: true
})

