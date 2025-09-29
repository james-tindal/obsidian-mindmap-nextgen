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
import { subject, Subject } from './subject'
import { completeWhen } from './complete-when'
import { tap } from './tap'
import { preventDefault } from './prevent-default'
import { dragAndDrop } from './drag-and-drop'
import { fromCommand } from './from-command'
import { fromObsidianEvent } from './from-obsidian-event'
import { groupBy } from './group-by'


export type Listener<T> = (data: T) => any
export type Subscriber<T> = {
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
  dragAndDrop,
  filter,
  flatMap,
  fromCommand,
  fromEvent,
  fromObsidianEvent,
  fromPromise,
  groupBy,
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
  dragAndDrop,
  filter,
  flatMap,
  fromCommand,
  fromEvent,
  fromObsidianEvent,
  fromPromise,
  groupBy,
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
export type { Source, UnwrapSource, Subject }
