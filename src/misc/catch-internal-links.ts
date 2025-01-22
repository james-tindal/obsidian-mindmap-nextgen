import { globalState } from './global-state'

export const catchInternalLinks = () => {
  const workspace = document.querySelector('.workspace' as 'div')

  if (!workspace)
    throw 'catch-internal-links called too early. Workspace not ready.'

  // Need to register this event to be scrapped when plugin dies

  workspace.addEventListener('click', event => {
    const { target } = event
    const isAnchor = target instanceof HTMLAnchorElement
      if (!isAnchor) return
    const parentMindmap = target.closest('svg.markmap' as 'svg')
      if (!parentMindmap) return
    const href = target.getAttribute('href')
      if (!href) return
    const hasProtocol = /:/.test(href)
      if (hasProtocol) return

    event.preventDefault()

    const { path } = globalState.svgs.get(parentMindmap)!
    app.workspace.openLinkText(href, path)
  })
}
