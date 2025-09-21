
export const toEntries =
  <const T extends object>(obj: T) =>
    Object.entries(obj) as { [K in keyof T]: [K, T[K]] }[keyof T][]

export const fromEntries =
  <const T extends readonly [PropertyKey, any][]>(entries: T) =>
    Object.fromEntries(entries) as {
      [K in T[number][0] & keyof any]: Extract<T[number], [K, any]>[1] }

export const mapEntries = <const T extends object, U extends [PropertyKey, any]>(
  obj: T,
  fn: (entry: { [K in keyof T]: [K, T[K]] }[keyof T]) => U
) =>
  fromEntries(toEntries(obj).map(fn))
