
declare module "callbag-pairwise" {
  import type { Source } from "callbag"

  const pairwise: <T>(s: Source<T>) => Source<[T, T]>
  
  export default pairwise
}

declare module "callbag-start-with" {
  import type { Source } from "callbag"

  const startWith: <StartWith>(...xs: StartWith[]) => <Parent extends StartWith>(inputSource: Source<Parent>) => Source<Parent>

  export default startWith
}

declare module "callbag-drop-repeats" {
  import type { Source } from "callbag"

  const dropRepeats: <T>(predicate?: (a: T, b: T) => boolean) => (inputSource: Source<T>) => Source<T>

  export default dropRepeats
}

declare module "callbag-sample-combine" {
  import type { Source } from "callbag"

  const sampleCombine: <P, L>(pullable: Source<P>) => (listenable: Source<L>) => Source<[L, P]>

  export default sampleCombine
}
