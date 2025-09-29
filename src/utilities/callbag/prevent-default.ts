import pipe from 'callbag-pipe'
import { tap } from './tap'
import { Source } from 'callbag'

export const preventDefault = <E extends Event>(event$: Source<E>) =>
  pipe(event$, tap(event => event.preventDefault()))
