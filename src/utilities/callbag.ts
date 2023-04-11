import create from "callbag-create";
import filter from "callbag-filter";
import flatMap from "callbag-flat-map";
import fromEvent from "callbag-from-event";
import fromPromise from "callbag-from-promise";
import map from "callbag-map";
import merge from "callbag-merge";
import of from "callbag-of";
import pairwise from "callbag-pairwise";
import pipe from "callbag-pipe";
import reject from "callbag-reject";
import share from "callbag-share";
import startWith from "callbag-start-with";
import subscribe from "callbag-subscribe";
import take from "callbag-take";
import takeUntil from "callbag-take-until";

import { Source, UnwrapSource } from "callbag";


const subject = <T>(): { source: Source<T>, push: (v: T) => void } => {
  let next: ((v: T) => void) | undefined;
  return {
    source: share(create<T>(next_ => {next = next_})),
    push: (v: T) => next && next(v)
  };
}

type Listener<T> = (data: T) => any
type Subscriber<T> = {
  next?: Listener<T>,
  error?: (err: any) => any,
  complete?: () => any,
}
const subscribe2 = <T>(source: Source<T>, listener: Listener<T> | Subscriber<T>) => pipe(source, subscribe(listener))



const Callbag = {
  create,
  filter,
  flatMap,
  fromEvent,
  fromPromise,
  map,
  merge,
  of,
  pairwise,
  pipe,
  reject,
  share,
  startWith,
  subject,
  subscribe: subscribe2,
  take,
  takeUntil
}

export {
  create,
  filter,
  flatMap,
  fromEvent,
  fromPromise,
  map,
  merge,
  of,
  pairwise,
  pipe,
  reject,
  share,
  startWith,
  subject,
  subscribe,
  take,
  takeUntil
}

export default Callbag
export type { Source, UnwrapSource }
