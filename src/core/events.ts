import Callbag, { completeWhen, distinct, map, merge, remember } from 'src/utilities/callbag'
import { plugin } from './entry'


export const start = Callbag.create<void>(
  (next, error, complete) => { next(); complete() })

export const pluginUnload = Callbag.create<void>(
  (next, error, complete) =>
    plugin.register(() => { next(); complete() }))

const completeOnUnload = completeWhen(pluginUnload)

export const cssChange = Callbag.pipe(
  Callbag.create<void>(next =>
    plugin.registerEvent(app.workspace.on('css-change', next))
  ),
  completeOnUnload
)

export const isDarkMode = Callbag.pipe(
  merge(start, cssChange),
  map(() => document.body.classList.contains('theme-dark')),
  distinct(),
  remember
)


Callbag.subscribe(isDarkMode, isDarkMode => {
  const method = isDarkMode ? 'add' : 'remove'
  document.body.classList[method]('markmap-dark')
})
