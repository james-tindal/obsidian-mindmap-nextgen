import create from 'callbag-create'
import share from 'callbag-share'

export type Subject<T> = ReturnType<typeof subject<T>>
export const subject = <T>() => {
  let next: (v: T) => void
  let error: (reason: unknown) => void
  let complete: () => void
  return {
    source: share(create<T>((next_, error_, complete_) => {
      next = next_
      error = error_
      complete = complete_
    })),
    push: Object.assign((v: T) => next(v), {
      next: (v: T) => next(v),
      error: (reason: unknown) => error(reason),
      complete: () => complete()
    })
  }
}
