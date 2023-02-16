import { curry } from "ramda"

type Path<EventName> = [EventName, number]

export class LocalEvents<EventName extends string> {
  private listeners: Record<string, Function[]> = {};

  public emit(name: EventName, data?: any) {
    const listeners = this.listeners[name];
    if (!listeners) return
    listeners.forEach(cb => cb(data))
  }

  public listen = curry((name: EventName, callback: Function) => {
    const path: Path<EventName> =
      [name, this.listeners?.[name]?.length ?? 0]

    if (this.listeners[name])
      this.listeners[name].push(callback)
    else
      this.listeners[name] = [callback]

    return this.unlisten(path);
  })

  private unlisten([name, index]: Path<EventName>) {
    return () => { delete this.listeners[name][index] }
  }
}

export function PromiseSubject<T>(): [(value: T | PromiseLike<T>) => void, Promise<T>] {
  let resolver;
  const promise = new Promise<T>(resolve => resolver = resolve)
  return [ resolver, promise ]
}

export const layoutReady = new Promise<void>(resolve => app.workspace.onLayoutReady(resolve))
export const nextTick = () => new Promise<void>(setImmediate)

export function* genLog<T>(message: string, generator: Generator<T>) {
  let count = 0;
  for (const x of generator) {
    console.info(message, count, x);
    count++;
    yield x;
  }
}


import autoBind from "auto-bind"

export class FindSet<T> extends Set<T> {
  constructor(...args: (Iterable<T> | null | undefined)[]) {
    super(...args);
    autoBind(this);
  }

  public find(pred: (v: T) => any) {
    for (const value of this)
      if (pred(value))
        return value
  }

  public filter(pred: (v: T) => any) {
    return [...(function*(set) {
      for (const value of set)
        if (pred(value))
          yield value
    })(this)]
  }
}

// Map constructor that binds all methods to the instance
export class Map<K, V> extends globalThis.Map<K, V> {
  constructor(entries?: readonly (readonly [K, V])[] | null) {
    super(entries);
    autoBind(this);
  }
}

import create from "callbag-create";
import of from "callbag-of";
import combine from "callbag-combine";
import pipe from "callbag-pipe";
import map from "callbag-map";
import subscribe from "callbag-subscribe";
import pairwise from "callbag-pairwise";
import filter from "callbag-filter";
import startWith from "callbag-start-with";
import flatMap from "callbag-flat-map";
import dropRepeats from "callbag-drop-repeats";
import sampleCombine from "callbag-sample-combine";
import fromFunction from "callbag-from-function";
import { Source } from "callbag"

const subject = <T>(): { source: Source<T>, emitter: (t: T) => void } => fromFunction()

export const Callbag = { combine, create, dropRepeats, filter, flatMap, map, of, pairwise, pipe, sampleCombine, startWith, subject, subscribe }
