
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

declare module 'callbag-take-until' {
  import { Source } from 'callbag'

  // const takeUntil: <T>(source: Source<T>) => Source<[T, T]>
  const takeUntil: <I>(notifier: Source<unknown>) => (source: Source<I>) => Source<I>


  export default takeUntil
}

