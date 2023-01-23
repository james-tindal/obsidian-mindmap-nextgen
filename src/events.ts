
export class LocalEvents<EventName extends string> {
  private listeners: Record<string, Function[]> = {};

  public emit(name: EventName, data: any) {
    const listeners = this.listeners[name];
    if (!listeners) return
    listeners.forEach(cb => cb(data))
  }

  public listen(name: EventName, callback: Function) {
    if (this.listeners[name])
      this.listeners[name].push(callback)
    else
      this.listeners[name] = [callback]
  }
}