
export class Set<T> extends globalThis.Set<T> {
  filter(fn: (row: T) => any) {
    const accumulator = new Set<T>()
    for (const row of this)
      if (fn(row)) accumulator.add(row)
    return accumulator
  }

  find(fn: (row: T) => any) {
    for (const row of this)
      if (fn(row)) return row
  }

  flatMap<Out>(fn: (row: T) => Set<Out>): Set<Out> {
    const accumulator = new Set<Out>()
    for (const row1 of this)
      for (const row2 of fn(row1))
        accumulator.add(row2)
    return accumulator
  }

  map<Out>(fn: (row: T) => Out): Set<Out> {
    const accumulator = new Set<Out>()
    for (const row of this)
      accumulator.add(fn(row))
    return accumulator
  }
}
