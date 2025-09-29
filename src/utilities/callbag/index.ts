import create from 'callbag-create'
import distinct from 'callbag-drop-repeats'
import filter from 'callbag-filter'
import flatMap from 'callbag-flat-map'
import fromEvent from 'callbag-from-event'
import fromPromise from 'callbag-from-promise'
import map from 'callbag-map'
import merge from 'callbag-merge'
import of from 'callbag-of'
import pairwise from 'callbag-pairwise'
import partition from 'callbag-partition'
import pipe from 'callbag-pipe'
import reject from 'callbag-reject'
import remember from 'callbag-remember'
import scan from 'callbag-scan'
import share from 'callbag-share'
import startWith from 'callbag-start-with'
import subscribe from 'callbag-subscribe'
import take from 'callbag-take'
import takeUntil from 'callbag-take-until'
import { debounce } from 'callbag-debounce'

import { Source, UnwrapSource } from 'callbag'
import { consumeSource, createSource } from 'callbag-toolkit'


const subject = <T>(): { source: Source<T>, push: (v: T) => void } => {
  let next: ((v: T) => void) | undefined
  return {
    source: share(create<T>(next_ => {next = next_})),
    push: (v: T) => next && next(v)
  }
}

const completeWhen = (trigger: Source<unknown>) => <T>(subject: Source<T>): Source<T> =>
  createSource(({ complete, ...rest }) => {
    const subjectConsumption = consumeSource(subject, {
      complete() {
        triggerConsumption.stop()
        subjectConsumption.stop()
      },
      ...rest
    })
    const triggerConsumption = consumeSource(trigger, {
      next() {
        triggerConsumption.stop()
        subjectConsumption.stop()
        complete()
      },
      complete() {
        triggerConsumption.stop()
      }
    })
    return () => {
      triggerConsumption.stop()
      subjectConsumption.stop()
    }
  })

const tap = <T>(fn: (value: T) => void) => (source: Source<T>) => {
  pipe(source, subscribe(fn))
  return source
}

const preventDefault = <E extends Event>(event$: Source<E>) =>
  pipe(event$, tap(event => event.preventDefault()))

type Listener<T> = (data: T) => any
type Subscriber<T> = {
  next?: Listener<T>,
  error?: (err: any) => any,
  complete?: () => any,
}
const subscribe2 = <T>(source: Source<T>, listener: Listener<T> | Subscriber<T>) => pipe(source, subscribe(listener))



const Callbag = {
  create,
  completeWhen,
  debounce,
  distinct,
  filter,
  flatMap,
  fromEvent,
  fromPromise,
  map,
  merge,
  of,
  pairwise,
  partition,
  pipe,
  preventDefault,
  reject,
  remember,
  scan,
  share,
  startWith,
  subject,
  subscribe: subscribe2,
  take,
  takeUntil,
  tap,
}

export {
  create,
  completeWhen,
  debounce,
  distinct,
  filter,
  flatMap,
  fromEvent,
  fromPromise,
  map,
  merge,
  of,
  pairwise,
  partition,
  pipe,
  preventDefault,
  reject,
  remember,
  scan,
  share,
  startWith,
  subject,
  subscribe,
  take,
  takeUntil,
  tap,
}

export default Callbag
export type { Source, UnwrapSource }
