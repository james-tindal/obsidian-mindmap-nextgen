import autoBind from "auto-bind"
import { curry } from "ramda"

type Path<EventName> = [EventName, number]

export class LocalEvents<EventName extends string> {
  private listeners: Record<string, Function[]> = {};

  constructor() { autoBind(this) }

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

export const nextTick = () => new Promise<void>(setImmediate)

export function* genLog<T>(message: string, generator: Generator<T>) {
  let count = 0;
  for (const x of generator) {
    console.info(message, count, x);
    count++;
    yield x;
  }
}

// Map constructor that binds all methods to the instance
export class Map<K, V> extends globalThis.Map<K, V> {
  constructor(entries?: readonly (readonly [K, V])[] | null) {
    super(entries);
    autoBind(this);
  }
}

export const isObjectEmpty = (object: Object) =>
  Object.keys(object).length === 0
