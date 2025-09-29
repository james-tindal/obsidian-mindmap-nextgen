import { Source } from 'callbag'
import create from 'callbag-create'
import share from 'callbag-share'

export const subject = <T>(): { source: Source<T>, push: (v: T) => void } => {
  let next: ((v: T) => void) | undefined
  return {
    source: share(create<T>(next_ => {next = next_})),
    push: (v: T) => next && next(v)
  }
}
