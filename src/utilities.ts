type Path<EventName> = [EventName, number]

export class LocalEvents<EventName extends string> {
  private listeners: Record<string, Function[]> = {};

  public emit(name: EventName, data?: any) {
    const listeners = this.listeners[name];
    if (!listeners) return
    listeners.forEach(cb => cb(data))
  }

  public listen(name: EventName, callback: Function) {
    const path: Path<EventName> =
      [name, this.listeners?.[name]?.length ?? 0]

    if (this.listeners[name])
      this.listeners[name].push(callback)
    else
      this.listeners[name] = [callback]

    return this.unlisten(path);
  }

  private unlisten([name, index]: Path<EventName>) {
    return () => { delete this.listeners[name][index] }
  }
}

export function PromiseSubject<T>(): [(value: T | PromiseLike<T>) => void, Promise<T>] {
  let resolver;
  const promise = new Promise<T>(resolve => resolver = resolve)
  return [ resolver, promise ]
}