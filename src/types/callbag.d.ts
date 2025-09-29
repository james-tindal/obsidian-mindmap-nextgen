
declare module 'callbag-of' {
  import { Source } from 'callbag'

  const of: <T>(...values: T[]) => Source<T>

  export default of
}

declare module 'callbag-flat-map' {
  import { Source } from 'callbag'

  const flatMap: <I, O>(fn: (v: I) => Source<O>) => (source: Source<I>) => Source<O>

  export default flatMap
}

declare module 'callbag-filter' {
  import { Source } from 'callbag'

  function filter <Out extends In, In>(predicate: (v: In) => v is Out): ((set: Source<In>) => Source<Out>)
  function filter <T>(predicate: (v: T) => any): ((set: Source<T>) => Source<T>)

  export default filter
}

declare module 'callbag-reject' {
  import { Source } from 'callbag'

  const reject: <Reject extends T, T>(predicate: (val: T) => val is Reject) => (source: Source<T>) => Source<Exclude<T, Reject>>

  export default reject
}

declare module 'callbag-scan' {
  import { Source } from 'callbag'

  function scan<I, O>(
    reducer: (acc: O, d: I) => O,
    seed: O,
  ): (source: Source<I>) => Source<O>
  function scan<IO>(
    reducer: (acc: IO, d: IO) => IO,
  ): (source: Source<IO>) => Source<IO>

  export default scan
}

declare module 'callbag-start-with' {
  import { Source } from 'callbag'

  const startWith: <T>(...values: T[]) => (source: Source<T>) => Source<T>

  export default startWith
}

declare module 'callbag-pairwise' {
  import { Source } from 'callbag'

  const pairwise: <T>(source: Source<T>) => Source<[T, T]>

  export default pairwise
}

declare module 'callbag-partition' {
  import { Source } from 'callbag'

  const partition: {
    <T, S extends T>(predicate: (value: T) => value is S):
      (source: Source<T>) =>
        [pass: Source<S>, fail: Source<Exclude<T, S>>]
    <T>(predicate: (value: T) => boolean):
      (source: Source<T>) =>
        [pass: Source<T>, fail: Source<T>]
  }

  export default partition
}

declare module 'callbag-take-until' {
  import { Source } from 'callbag'

  const takeUntil: <I>(notifier: Source<unknown>) => (source: Source<I>) => Source<I>

  export default takeUntil
}

declare module 'callbag-drop-repeats' {
  import { Source } from 'callbag'

  const dropRepeats: <I>(shouldDrop?: (previous: I, latest: I) => boolean) => (source: Source<I>) => Source<I>

  export default dropRepeats
}

declare module 'callbag-replay-all' {
  import { Source } from 'callbag'

  const replay: (count?: number) => <I>(source: Source<I>) => Source<I>

  export default replay
}
