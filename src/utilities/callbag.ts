import create from "callbag-create";
import filter from "callbag-filter";
import flatMap from "callbag-flat-map";
import fromPromise from "callbag-from-promise";
import map from "callbag-map";
import merge from "callbag-merge";
import of from "callbag-of";
import pairwise from "callbag-pairwise";
import pipe from "callbag-pipe";
import reject from "callbag-reject";
import share from "callbag-share";
import startWith from "callbag-start-with";
import _subscribe from "callbag-subscribe";
import take from "callbag-take";

import { Source, UnwrapSource } from "callbag";


const subject = <T>(): { source: Source<T>, push: (v: T) => void } => {
  let next: ((v: T) => void) | undefined;
  return {
    source: share(create<T>(next_ => {next = next_})),
    push: (v: T) => next && next(v)
  };
}

const subscribe = <T>(source: Source<T>, listener: (c: T) => void) => pipe(source, _subscribe(listener))



const Callbag = {
  create,
  filter,
  flatMap,
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
}

export {
  create,
  filter,
  flatMap,
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
}

export default Callbag
export type { Source, UnwrapSource }
