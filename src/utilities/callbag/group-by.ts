import create from 'callbag-create'
import { Source } from 'callbag'
import Callbag, { Subject, subject } from '.'
import { Merge } from 'type-fest'
import replay from 'callbag-replay-all'


export type GroupedSource<Key, T> = Source<T> & { key: Key }
export type GroupedSubject<Key, T> = Merge<Subject<T>, { source: GroupedSource<Key, T> }>
export const groupBy = <Key, In>(keyFn: (data: In) => Key) => (source: Source<In>): Source<GroupedSource<Key, In>> => 
  replay()(create((next, error, complete) => {
    const groups = new Map<Key, GroupedSubject<Key, In>>()
    return Callbag.subscribe(source, {
      error(reason) {
        error(reason)
        for (const { push } of groups.values())
          push.error(reason)
      },
      complete() {
        complete()
        for (const { push } of groups.values())
          push.complete()
      },
      next(data) {
        const key = keyFn(data)
        if (groups.has(key))
          groups.get(key)!.push(data)
        else {
          const sub = groupedSubject<Key, In>(key)
          groups.set(key, sub)
          next(sub.source)
          sub.push(data)
        }
      }
    })
  }))

const groupedSubject = <Key, T>(key: Key): GroupedSubject<Key, T> => {
  const sub = subject<T>()
  return {
    source: Object.assign(sub.source, { key }),
    push: sub.push
  }
}
