import Callbag, { distinct, flatMap, fromPromise, map, merge, remember } from 'src/utilities/callbag'
import { plugin } from './entry'
import { layoutManager } from 'src/views/layout-manager'
import { fromObsidianEvent } from 'src/utilities/from-obsidian-event'
import { renderTabs$ } from 'src/rendering/style-features'
import views from 'src/views/views'
import { fromCommand } from 'src/utilities/from-command'


export const start = Callbag.create<void>(
  (next, error, complete) => { next(); complete() })

export const layoutReady = new Promise<void>(resolve =>
  app.workspace.onLayoutReady(resolve))

const mmngLayoutReady = layoutReady.then(layoutManager.deserialise)

export const layoutChange = Callbag.pipe(
  fromPromise(mmngLayoutReady),
  flatMap(() => Callbag.create<void>((next, error, complete) => {
    next()
    plugin.registerEvent(app.workspace.on('layout-change', next))
    plugin.register(complete)
  }))
)

export const cssChange = fromObsidianEvent(app.workspace, 'css-change').void()

export const isDarkMode = Callbag.pipe(
  merge(start, cssChange),
  map(() => document.body.classList.contains('theme-dark')),
  distinct(),
  remember
)

export const fileOpen = fromObsidianEvent(app.workspace, 'file-open').unary()
export const fileRenamed = fromObsidianEvent(app.vault, 'rename').unary()

export const commandOpenUnpinned = fromCommand('mindmapnextgen:unpinned', 'Open unpinned mindmap')
export const commandOpenPinned = fromCommand('mindmapnextgen:pinned', 'Open pinned mindmap')


Callbag.subscribe(isDarkMode, isDarkMode => {
  const method = isDarkMode ? 'add' : 'remove'
  document.body.classList[method]('markmap-dark')
})

Callbag.subscribe(renderTabs$, views.renderAll)
