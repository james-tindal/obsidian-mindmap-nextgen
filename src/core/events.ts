import Callbag, { distinct, flatMap, map, merge, remember } from 'src/utilities/callbag'
import Plugin from './entry'


export const plugin = Plugin.stream

export const cssChange = Callbag.pipe(
  plugin,
  flatMap(plugin =>
    Callbag.create<void>(next =>
      plugin.registerEvent(app.workspace.on('css-change', next))
      // when plugin unloads, it should also end all the streams, not just deregister the initial listener
      // how do you do this?
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
