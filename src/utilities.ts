import autoBind from "auto-bind"
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
