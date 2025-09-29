import { Source } from 'callbag'
import pipe from 'callbag-pipe'
import subscribe from 'callbag-subscribe'

export const tap = <T>(fn: (value: T) => void) => (source: Source<T>) => {
  pipe(source, subscribe(fn))
  return source
}
