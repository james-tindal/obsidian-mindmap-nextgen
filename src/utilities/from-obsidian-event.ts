import type { Events } from 'obsidian'
import Callbag, { map } from './callbag'
import { plugin } from 'src/core/entry'
import { Simplify } from 'type-fest'


// Typing could fail if target has more than 20 events
export function fromObsidianEvent<
  Target extends Events,
  Name extends GetName<Target>
>(target: Target, name: Name) {
  type OnMethod = GetOnMethod<Target>
  type OnMethodParams = OverloadedParams<OnMethod>
  type Callback = GetCallback<OnMethodParams, Name>
  type CallbackParams = Parameters<Callback>

  const stream = Callbag.create<CallbackParams>((next, error, complete) => {
    const sendArgsArray = (...args: CallbackParams) => next(args)
    const ref = target.on(name, sendArgsArray)
    plugin.registerEvent(ref)
    plugin.register(complete)
  })

  return Object.assign(stream, {
    void: () => Callbag.pipe(stream, map(() => {})),
    unary: () => Callbag.pipe(stream, map(args => args[0] as typeof args[0])),
    object: <const Keys extends MapToStrings<CallbackParams>>(...keys: Keys) =>
      Callbag.pipe(stream, map(args => zip(keys, args)))
  })
}

type Zip<
  K extends readonly PropertyKey[],
  V extends readonly any[]
> = Simplify<{
  [I in keyof K as I extends `${number}`
    ? K[I] extends PropertyKey
      ? K[I]
      : never
    : never
  ]: I extends keyof V
     ? V[I]
     : never
}>
function zip<
  K extends readonly PropertyKey[],
  V extends readonly any[]
>( keys: K, values: V ): Zip<K, V> {
  const out = {} as any
  for (let i = 0; i < keys.length; i++)
    if (i in values) out[keys[i]] = values[i]
  return out
}


type MapToStrings<T extends unknown[]> =
  { [K in keyof T]: string }

type GetCallback<Params extends [...args: any], Name extends string> =
  Params extends [name: Name, callback: infer Callback, ...args: any[]]
    ? Callback : never

type GetOnMethod<Target extends Events> =
  Target['on']

type GetName<Target extends Events> =
  OverloadedParams<GetOnMethod<Target>>[0]

type OverloadedParams<T> = T extends {
  (...args: infer A1): any
  (...args: infer A2): any
  (...args: infer A3): any
  (...args: infer A4): any
  (...args: infer A5): any
  (...args: infer A6): any
  (...args: infer A7): any
  (...args: infer A8): any
  (...args: infer A9): any
  (...args: infer A10): any
  (...args: infer A11): any
  (...args: infer A12): any
  (...args: infer A13): any
  (...args: infer A14): any
  (...args: infer A15): any
  (...args: infer A16): any
  (...args: infer A17): any
  (...args: infer A18): any
  (...args: infer A19): any
  (...args: infer A20): any
} ? ( A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9 | A10
    | A11 | A12 | A13 | A14 | A15 | A16 | A17 | A18 | A19 | A20
) : never
