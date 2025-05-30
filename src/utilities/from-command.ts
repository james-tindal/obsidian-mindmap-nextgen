import { plugin } from 'src/core/entry'
import Callbag from './callbag'

export const fromCommand = (id: string, name: string) =>
  Callbag.create<void>((next, error, complete) => {
    plugin.addCommand({ id, name, callback: next })
    plugin.register(complete)
  })
