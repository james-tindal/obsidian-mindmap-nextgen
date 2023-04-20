import { Source } from "callbag"
import Callbag, { flatMap, reject } from "src/utilities/callbag"

export interface Tagged<Tag extends string, Data> { tag: Tag, data: Data }
export const Tagged = <const Tag extends string, const Data>(tag: Tag, data: Data): Tagged<Tag, Data> => ({ tag, data })

export type ExtractUnion<Constructors extends Record<string, (data: any) => Tagged<string, any>>> =
  ReturnType<Constructors[keyof Constructors]>

export type ExtractRecord<Constructors extends Record<string, (data: any) => Tagged<string, any>>> =
  { [Key in keyof Constructors]: ReturnType<Constructors[Key]> }

export function unionConstructors<Members extends readonly Tagged<string, any>[]>(...members: Members) {
  return Object.fromEntries(members.map(({ tag, data }) => [tag, (data: any) => Tagged(tag, data)])) as
    { [ Member in Members[number] as Member["tag"] ]: (data: Member["data"]) => Member }
}

const type_representative: unknown = undefined
export const tr = type_representative


type _Matcher<Event extends Tagged<string, any>, Return = any> = {
  [Data in Event["data"] as Event["tag"]]: (data: Data) => Return
}
export type Matcher<In extends Tagged<string, any>, Out = any> = In extends any ? _Matcher<In, Out> : never;

export const match = <Event extends Tagged<string, any>, Return>
  (event: Event, matcher: Matcher<Event, Return>) =>
    matcher[event.tag](event.data)

const isIterable = <T>(x): x is Iterable<T> => !!x?.[Symbol.iterator]

export type Stackable<T> = void | T | Iterable<void | T>
export const Stackable = {
  flatten: <T>(stack$: Source<Stackable<T>>) => Callbag.pipe(
    stack$,
    reject((x): x is void => !x),
    flatMap(x => isIterable(x) ? Callbag.of(...x) : Callbag.of(x)),
    reject((x): x is void => !x),
  )
}