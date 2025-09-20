import autoBind from 'auto-bind'
import { curry } from 'ramda'

type Path<EventName> = [EventName, number]

export class LocalEvents<EventName extends string> {
  private listeners: Record<string, Function[]> = {}

  constructor() { autoBind(this) }

  public emit(name: EventName, data?: any) {
    const listeners = this.listeners[name]
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

    return this.unlisten(path)
  })

  private unlisten([name, index]: Path<EventName>) {
    return () => { delete this.listeners[name][index] }
  }
}


declare global {
  interface PromiseConstructor {
    withResolvers<T>(): {
      promise: Promise<T>
      resolve: (value: T | PromiseLike<T>) => void
      reject: (reason?: unknown) => void
    }
  }
}
if (!Promise.withResolvers)
  Promise.withResolvers = () => {
    let resolve, reject
    const promise = new Promise((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject } as any
  }

export const nextTick = () => new Promise<void>(setImmediate)

export function* genLog<T>(message: string, generator: Generator<T>) {
  let count = 0
  for (const x of generator) {
    console.info(message, count, x)
    count++
    yield x
  }
}

// Map constructor that binds all methods to the instance
export class Map<K, V> extends globalThis.Map<K, V> {
  constructor(entries?: readonly (readonly [K, V])[] | null) {
    super(entries)
    autoBind(this)
  }
}

export const isObjectEmpty = (object: Object) =>
  Object.keys(object).length === 0

export const iife = <Return>(fn: () => Return) => fn()
