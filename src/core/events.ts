import Callbag, { completeWhen, distinct, flatMap, map, merge, remember } from 'src/utilities/callbag'
import Plugin from './entry'


export const plugin = Plugin.stream

export const pluginUnload = Callbag.pipe(
  plugin,
  flatMap(plugin =>
    Callbag.create<void>((next, error, complete) =>
      plugin.register(() => { next(); complete() }))
  )
)

const completeOnUnload = completeWhen(pluginUnload)

export const cssChange = Callbag.pipe(
  plugin,
  flatMap(plugin =>
    Callbag.create<void>(next =>
      plugin.registerEvent(app.workspace.on('css-change', next))
    )
  )
)

export const isDarkMode = Callbag.pipe(
  merge(cssChange, plugin),
  map(() => document.body.classList.contains('theme-dark')),
  distinct(),
  remember
)


Callbag.subscribe(isDarkMode, isDarkMode => {
  const method = isDarkMode ? 'add' : 'remove'
  document.body.classList[method]('markmap-dark')
})
