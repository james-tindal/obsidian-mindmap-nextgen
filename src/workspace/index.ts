import {  MarkdownPostProcessorContext, MarkdownRenderChild, TFile } from "obsidian"
import { FileSettings, GlobalSettings, globalSettings$ } from "src/settings/filesystem"
import readMarkdown from "src/rendering/renderer-common"
import Callbag, { filter, flatMap, fromPromise, map, merge, pairwise, reject, Source, startWith, take } from "src/utilities/callbag"
import { ImmutableSet } from "src/utilities/immutable-set"
import { FileMap, getLayout } from "./get-layout"
import { CodeBlockRow, createDb, Database, FileRow, TabRow } from "./db-schema"
import { CodeBlock, FileTab } from "./types"
import { CodeBlockRenderer } from "src/rendering/renderer-codeblock"
import { MaybePromise, nextTick } from "src/utilities/utilities"



interface Tagged<Tag extends string, Data> { tag: Tag, data: Data }
const Tagged = <const Tag extends string, const Data>(tag: Tag, data: Data): Tagged<Tag, Data> => ({ tag, data })

type ExtractUnion<Constructors extends Record<string, (data: any) => Tagged<string, any>>> =
  ReturnType<Constructors[keyof Constructors]>

function unionConstructors<Members extends readonly Tagged<string, any>[]>(...members: Members) {
  return Object.fromEntries(members.map(({ tag, data }) => [tag, (data: any) => Tagged(tag, data)])) as
    { [ Member in Members[number] as Member["tag"] ]: (data: Member["data"]) => Member }
}

const type_representative: unknown = undefined
const tr = type_representative


const InputEvent = unionConstructors(
  Tagged("codeBlock created", tr as CodeBlock),
  Tagged("codeBlock deleted", tr as CodeBlock),
  Tagged("tab opened",      tr as FileTab.Leaf),
  Tagged("tab closed",      tr as FileTab.Leaf),
  Tagged("tab current",     tr as FileTab.Leaf),
  Tagged("tab not current", tr as FileTab.Leaf),
  Tagged("tab changed file", tr as [ FileTab.Leaf, TFile ]),
  Tagged("fileSettings",     tr as { file: TFile, settings: FileSettings }),
  Tagged("globalSettings",   tr as GlobalSettings),
)
type InputEvent = ExtractUnion<typeof InputEvent>

const CodeBlockEvent = unionConstructors(
  Tagged("start",          tr as { codeBlock: CodeBlock, globalSettings: GlobalSettings, fileSettings: FileSettings, isCurrent: boolean, tabView: FileTab.View }),
  Tagged("current",        tr as { codeBlock: CodeBlock }),
  Tagged("globalSettings", tr as { codeBlock: CodeBlock, globalSettings: GlobalSettings }),
  Tagged("fileSettings",   tr as { codeBlock: CodeBlock, fileSettings: FileSettings }),
  Tagged("end",            tr as { codeBlock: CodeBlock }),
)
type CodeBlockEvent = ExtractUnion<typeof CodeBlockEvent>



const layoutChange$ = Callbag.create<void>((next: () => void) => {
  app.workspace.on("layout-change", next);
  app.workspace.on("active-leaf-change", next);
})

const layout$ = Callbag.pipe(
  layoutChange$,
  map(getLayout),
  startWith({ tabs: new ImmutableSet, currentTabs: new ImmutableSet, files: new FileMap }),
  pairwise,
  map(([a, b]) => ({
    tabs:        ImmutableSet.diff(a.tabs, b.tabs),
    currentTabs: ImmutableSet.diff(a.currentTabs, b.currentTabs),
    files:       FileMap     .diff(a.files, b.files)
  })),
  flatMap(({ tabs, currentTabs, files }) =>
    Callbag.of(...[
      ...       tabs.  added.map(InputEvent["tab opened"]),
      ...       tabs.removed.map(InputEvent["tab closed"]),
      ...currentTabs.  added.map(InputEvent["tab current"]),
      ...currentTabs.removed.map(InputEvent["tab not current"]),
      ...      files.changed.map(InputEvent["tab changed file"]),
    ]))
)


const fileChange$: Source<{ file: TFile, bodyText: string }> =
  Callbag.create(next => {
    app.workspace.on("editor-change", (editor, info) => next({ file: info.file!, bodyText: editor.getValue() }));
    // app.vault.on("modify", (abstractFile) =>
    //   `search for the file in our set of open files. if found, push settings updates and renders. 
    //    This should go in a separate stream.`);
  })

const file$ = Callbag.pipe(
  fileChange$,
  map(({ file, bodyText }) => ({ file, ...readMarkdown<TFile>(bodyText) }))
)


const { source: codeBlock$, push: codeBlockEvent } = Callbag.subject<InputEvent & { tag: `codeBlock ${"created" | "deleted"}` }>()

export async function codeBlockHandler(markdown: string, containerEl: HTMLDivElement, ctx: MarkdownPostProcessorContext) {
  const childComponent = new MarkdownRenderChild(containerEl)
  ctx.addChild(childComponent)

  const codeBlock = new CodeBlock(markdown, containerEl, () => ctx.getSectionInfo(containerEl)!)
  
  // elements aren't added to the DOM until after this function returns.
  // this puts "codeBlock created" after "tab opened"
  await nextTick()

  codeBlockEvent(InputEvent["codeBlock created"](codeBlock))
  childComponent.register(() =>
    codeBlockEvent(InputEvent["codeBlock deleted"](codeBlock)))
}


const fileSettings$ = Callbag.pipe(file$, map(InputEvent.fileSettings))

const globalSettingsEvent$ = Callbag.pipe(globalSettings$, map(InputEvent.globalSettings))

const inputEvent$ = Callbag.share(merge(layout$, codeBlock$, fileSettings$, globalSettingsEvent$))

type _Matcher<Event extends Tagged<string, any>, Return = any> = {
  [Data in Event["data"] as Event["tag"]]: (data: Data) => Return
}
type Matcher<Event extends Tagged<string, any>, Return = any> = Event extends any ? _Matcher<Event, Return> : never;

const match = <Event extends Tagged<string, any>, Return>
  (event: Event, matcher: Matcher<Event, Return>) =>
    matcher[event.tag](event.data)

type EventMatcher = Matcher<InputEvent, MaybePromise<void | CodeBlockEvent | Iterable<MaybePromise<void | CodeBlockEvent>>>>


async function getSettings (fileHandle: TFile) {
  const markdown = await app.vault.cachedRead(fileHandle)
  const { settings } = readMarkdown<TFile>(markdown)
  return settings
}

const matcher = (database: Database): EventMatcher => { const matcher = {
  "tab opened": leaf => {
    const fileHandle = leaf.view.file
    const fileRowInDb = database.files.find(row => row.handle === fileHandle)
    let fileRow: FileRow

    if (fileRowInDb)
      fileRow = fileRowInDb
    else {
      fileRow = FileRow({ handle: fileHandle, settings: getSettings(fileHandle) })
      database.files.add(fileRow)
    }

    const tabRow = TabRow({ leaf, view: leaf.view, containerEl: leaf.containerEl, file: fileRow })
    database.tabs.add(tabRow)
    fileRow.tabs.add(tabRow)

    return database.codeBlocksWaiting
      .filter(codeBlock => leaf.containerEl.contains(codeBlock.containerEl))
      .map(codeBlock => {
        database.codeBlocksWaiting.delete(codeBlock)
        return matcher["codeBlock created"](codeBlock)
      })
  },

  "tab changed file": ([tabLeaf, newFileHandle]) => {
    const tabRow         = database.tabs.find(row => row.leaf === tabLeaf)!
    const oldFileHandle  = tabRow.file.handle
    const oldFileRow     = database.files.find(row => row.handle === oldFileHandle)!
    const newFileRowInDb = database.files.find(row => row.handle === newFileHandle)
    let newFileRow: FileRow

    if (newFileRowInDb)
      newFileRow = newFileRowInDb
    else {
      // Create new FileRow
      newFileRow = FileRow({ handle: newFileHandle, settings: getSettings(newFileHandle) })
      // Add it to the db
      database.files.add(newFileRow)
    }
    
    // Update 1-to-many relation
    tabRow.file = newFileRow
    // Remove file from files if no tab refers to it.
    const old_file_is_not_in_use = ! database.tabs.find(row => row.file.handle === oldFileHandle)
    if (old_file_is_not_in_use) database.files.delete(oldFileRow)
  },
  "tab current": tabLeaf => {
    const tabRow = database.tabs.find(row => row.leaf === tabLeaf)!
    tabRow.isCurrent = true
    return tabRow.codeBlocks.map(CodeBlockEvent.current)
  },
  "tab not current": tabLeaf => {
    const tabRow = database.tabs.find(row => row.leaf === tabLeaf)
    tabRow && (tabRow.isCurrent = false)
  },
  "tab closed": tabLeaf => {
    const tabRow = database.tabs.find(row => row.leaf === tabLeaf)!
    const fileRow = tabRow.file

    // remove tab from db.tabs
    database.tabs.delete(tabRow)

    // remove tab from db.files
    database.files.forEach(fileRow => fileRow.tabs.delete(tabRow))

    // remove file if it has no tabs
    database.tabs.find(row => row.file === fileRow)

    // codeBlocks will each have their own delete events
  },
  "codeBlock created": async codeBlock => {
    const tabRow = database.tabs.find(tab => tab.containerEl.contains(codeBlock.containerEl))
    
    if (!tabRow) {
      database.codeBlocksWaiting.add(codeBlock)
      return
    }

    const codeBlockRow = CodeBlockRow({ codeBlock, tab: tabRow })

    database.codeBlocks.add(codeBlockRow)
    tabRow.codeBlocks.add(codeBlockRow)

    const globalSettings = database.globalSettings
    const fileSettings = await tabRow.file.settings
    const isCurrent = tabRow.isCurrent
    const tabView = tabRow.view

    return CodeBlockEvent.start({ codeBlock, globalSettings, fileSettings, isCurrent, tabView })

  },
  "codeBlock deleted": codeBlock => {
    const codeBlockRow = database.codeBlocks.find(row => row.codeBlock === codeBlock)!

    database.codeBlocks.delete(codeBlockRow)
    codeBlockRow.tab.codeBlocks.delete(codeBlockRow)

    return CodeBlockEvent.end({ codeBlock })
  },
  "fileSettings" ({ file, settings }) {
    const fileRow = database.files.find(row => row.handle === file)!
    fileRow.settings = settings

    return fileRow.tabs.flatMap(tabRow =>
      tabRow.codeBlocks.map(({ codeBlock }) =>
        CodeBlockEvent.fileSettings({ codeBlock, fileSettings: settings})
      ))
  },
  "globalSettings": globalSettings => {
    database.globalSettings = globalSettings
    return database.codeBlocks.map(({ codeBlock }) =>
      CodeBlockEvent.globalSettings({ codeBlock, globalSettings }))
  }
}; return matcher }


const isPromise = <T>(x): x is Promise<T> => x instanceof Promise
const isIterable = <T>(x): x is Iterable<T> => !!x?.[Symbol.iterator]

const codeBlockEvent$ = Callbag.pipe(
  inputEvent$,
  filter((event): event is Tagged<"globalSettings", GlobalSettings> => event.tag === "globalSettings"),
  take(1),
  flatMap(({ data: globalSettings }) => {
    const database = createDb(globalSettings)
    const eventMatcher = (event: InputEvent) => match(event, matcher(database))
    return map(eventMatcher)(inputEvent$)
  }),
  flatMap(x => isPromise(x) ? fromPromise(x) : Callbag.of(x)),
  reject((x): x is void => !x),
  flatMap(x => isIterable(x) ? Callbag.of(...x) : Callbag.of(x)),
  flatMap(x => isPromise(x) ? fromPromise(x) : Callbag.of(x)),
  reject((x): x is void => !x),
)


const renderers = new Map<CodeBlock, CodeBlockRenderer>()
Callbag.subscribe(codeBlockEvent$, event => match(event, {
  "start" ({ codeBlock, globalSettings, fileSettings, isCurrent, tabView }) {
    const renderer = CodeBlockRenderer(codeBlock, tabView, globalSettings, fileSettings)
    if (isCurrent) renderer.fit()
    renderers.set(codeBlock, renderer)
  },
  "current" ({ codeBlock }) {
    renderers.get(codeBlock)!.fit()
  },
  "globalSettings" ({ codeBlock, globalSettings }) {
    renderers.get(codeBlock)!.updateGlobalSettings(globalSettings)
  },
  "fileSettings" ({ codeBlock, fileSettings }) {
    renderers.get(codeBlock)!.updateFileSettings(fileSettings)
  },
  "end" ({ codeBlock }) {
    renderers.delete(codeBlock)
  }
}))
