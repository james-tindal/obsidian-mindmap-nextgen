import autoBind from 'auto-bind'
import { curry } from 'ramda'

class BoundSet<T> extends Set<T> {
  constructor(...args: (Iterable<T> | null | undefined)[]) {
    super(...args)
    autoBind(this)
  }
}

export class ImmutableSet<T> {
  private readonly set: BoundSet<T>
  public readonly tag = 'ImmutableSet'
  constructor(...args: (Iterable<T> | null | undefined)[]) {
    this.set = new BoundSet(...args)
    autoBind(this)
  }

  [Symbol.iterator] = () => this.set[Symbol.iterator]()

  static add = curry(<T>(value: T, set: ImmutableSet<T>) => set.add(value))
  add(value: T) { return new ImmutableSet(this, [value]) }

  static diff = <T>(a: ImmutableSet<T>, b: ImmutableSet<T>) => a.diff(b)
  diff(other: ImmutableSet<T>) {
    const added = new Set<T>()
    const removed = new Set<T>()

    for (const x of union(this, other)) {
      if (!this .has(x)) added  .add(x)
      if (!other.has(x)) removed.add(x)
    }

    return {
      added: new ImmutableSet(added),
      removed: new ImmutableSet(removed),
      equal: added.size === 0 && removed.size === 0 
    }
  }

  static equal = curry(<T>(b: ImmutableSet<T>, a: ImmutableSet<T>) => a.equal(b))
  equal = (other: ImmutableSet<T>) => this.diff(other).equal

  static filter<Out extends In, In>(predicate: (v: In) => v is Out): ((set: ImmutableSet<In>) => ImmutableSet<Out>)
  static filter<T>(predicate: (v: T) => any): ((set: ImmutableSet<T>) => ImmutableSet<T>)
  static filter(predicate: any) { return (set: any) => set.filter(predicate) }

  filter<Out extends T>(predicate: (v: T) => v is Out): ImmutableSet<Out>
  filter(predicate: (v: T) => any): ImmutableSet<T>
  filter(predicate: any) {
    return new ImmutableSet((function*(set) {
      for (const value of set)
        if (predicate(value))
          yield value
    })(this))
  }

  static find = curry(<T>(predicate: (v: T) => any, set: ImmutableSet<T>) => set.find(predicate))
  find(predicate: (v: T) => any) {
    for (const value of this)
      if (predicate(value))
        return value
  }

  flatMap<Out>(fn: (v: T) => Iterable<Out>): ImmutableSet<Out> {
    const new_values = this.map(fn)
    return new_values.reduce(new ImmutableSet<Out>(), (out, iterable) => new ImmutableSet(out, iterable))
  }

  static from = <T>(fn: (arg: any) => Iterable<T>) => (arg: any) => new ImmutableSet(fn(arg))

  static has = curry(<T>(value: T, set: ImmutableSet<T>) => set.has(value))
  has(value: T) { return this.set.has(value) }

  static map = <In, Out>(fn: (v: In) => Out) => (set: ImmutableSet<In>) => set.map(fn)
  map<Out>(fn: (v: T) => Out) {
    const newSet = new Set<Out>()
    for (const v of this) {
      newSet.add(fn(v))
    }
    return new ImmutableSet(newSet)
  }

  reduce<Output>(initial: Output, fn: (accumulator: Output, next: T) => Output): Output {
    let accumulator = initial
    for (const next of this) {
      accumulator = fn(accumulator, next)
    }
    return accumulator
  }

  reject<Reject extends T>(predicate: (val: T) => val is Reject) {
    return new ImmutableSet((function*(set) {
      for (const value of set)
        if (!predicate(value))
          yield value as Exclude<T, Reject>
    })(this))
  }

  static remove = curry(<T>(value: T, set: ImmutableSet<T>) => set.remove(value))
  remove(value: T) {
    const newSet = new Set(this)
    newSet.delete(value)
    return new ImmutableSet(newSet)
  }

  get size() { return this.set.size }
  get values() { return this.set.values }
}

function* union<T>(a: ImmutableSet<T>, b: ImmutableSet<T>) {
  yield* a
  for (const x of b)
    if (!a.has(x)) yield x
}
