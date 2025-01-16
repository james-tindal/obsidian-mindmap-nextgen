import { MarkdownPostProcessorContext, MarkdownRenderChild, TFile } from 'obsidian'
import GrayMatter from 'gray-matter'

import { FileSettings, GlobalSettings, globalSettings$ } from 'src/settings/filesystem'
import Callbag, { filter, flatMap, map, merge, pairwise, Source, startWith, take } from 'src/utilities/callbag'
import { ImmutableSet } from 'src/utilities/immutable-set'
import { FileMap, getLayout } from './get-layout'
import { CodeBlockRow, createDb, Database, FileRow, TabRow } from './db-schema'
import { CodeBlock, FileTab } from './types'
import { CodeBlockRenderer } from 'src/rendering/renderer-codeblock'
import { isObjectEmpty, nextTick } from 'src/utilities/utilities'
import { ExtractRecord, ExtractUnion, Matcher, Stackable, Tagged, match, tr, unionConstructors } from './utilities'
import { parseMarkdown } from 'src/rendering/renderer-common'
import { FileSettingsDialog } from 'src/settings/dialogs'



const InputEvent = unionConstructors(
  Tagged('codeBlock created', tr as CodeBlock),
  Tagged('codeBlock deleted', tr as CodeBlock),
  Tagged('tab opened',      tr as FileTab.Leaf),
  Tagged('tab closed',      tr as FileTab.Leaf),
  Tagged('tab current',     tr as FileTab.Leaf),
  Tagged('tab not current', tr as FileTab.Leaf),
  Tagged('tab changed file', tr as [ FileTab.Leaf, TFile ]),
  Tagged('fileSettings',     tr as { file: TFile, settings: FileSettings }),
  Tagged('globalSettings',   tr as GlobalSettings),
)
type InputEvent = ExtractUnion<typeof InputEvent>
type InputEvents = ExtractRecord<typeof InputEvent>

const CodeBlockEvent = unionConstructors(
  Tagged('start',          tr as { codeBlock: CodeBlock, globalSettings: GlobalSettings, fileSettings: FileSettings, isCurrent: boolean, tabView: FileTab.View, tabRow: TabRow }),
  Tagged('current',        tr as { codeBlock: CodeBlock }),
  Tagged('globalSettings', tr as { codeBlock: CodeBlock, globalSettings: GlobalSettings }),
  Tagged('fileSettings',   tr as { codeBlock: CodeBlock, fileSettings: FileSettings }),
  Tagged('end',            tr as { codeBlock: CodeBlock }),
)
type CodeBlockEvent = ExtractUnion<typeof CodeBlockEvent>


const { source: codeBlock$, push: codeBlockEvent } = Callbag.subject<InputEvents[`codeBlock ${'created' | 'deleted'}`]>()

export async function codeBlockHandler(markdown: string, containerEl: HTMLDivElement, ctx: MarkdownPostProcessorContext) {
  const childComponent = new MarkdownRenderChild(containerEl)
  ctx.addChild(childComponent)

  const codeBlock = new CodeBlock(markdown, containerEl, () => ctx.getSectionInfo(containerEl)!)

  // elements aren't added to the DOM until after this function returns.
  // this puts "codeBlock created" after "tab opened"
  await nextTick()

  codeBlockEvent(InputEvent['codeBlock created'](codeBlock))
  childComponent.register(() =>
    codeBlockEvent(InputEvent['codeBlock deleted'](codeBlock)))
}



const layoutChange$ = Callbag.create<void>((next: () => void) => {
  app.workspace.on('layout-change', next)
  app.workspace.on('active-leaf-change', next)
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
      ...       tabs.  added.map(InputEvent['tab opened']),
      ...       tabs.removed.map(InputEvent['tab closed']),
      ...currentTabs.  added.map(InputEvent['tab current']),
      ...currentTabs.removed.map(InputEvent['tab not current']),
      ...      files.changed.map(InputEvent['tab changed file']),
    ]))
)


const fileChange$: Source<{ file: TFile, bodyText: string }> =
  Callbag.create(next => {
    app.workspace.on('editor-change', (editor, info) => next({ file: info.file!, bodyText: editor.getValue() }))
    // app.vault.on("modify", (abstractFile) =>
    //   `search for the file in our set of open files. if found, push settings updates and renders. 
    //    This should go in a separate stream.`);
  })

const file$ = Callbag.pipe(
  fileChange$,
  map(({ file, bodyText }) => ({ file, ...parseMarkdown<'file'>(bodyText) }))
)

const fileSettings$ = Callbag.pipe(file$, map(InputEvent.fileSettings))

const globalSettingsEvent$ = Callbag.pipe(globalSettings$, map(InputEvent.globalSettings))

const inputEvent$: Source<InputEvent> = Callbag.share(merge(layout$, codeBlock$, fileSettings$, globalSettingsEvent$))

type EventMatcher = Matcher<InputEvent, Stackable<CodeBlockEvent>>

const matcher = (database: Database): EventMatcher => { const matcher = {
  'tab opened': leaf => {
    const fileHandle = leaf.view.file
    const fileRowInDb = database.files.find(row => row.handle === fileHandle)
    let fileRow: FileRow

    if (fileRowInDb)
      fileRow = fileRowInDb
    else {
      const fileText = leaf.view.editor.getValue()
      fileRow = FileRow({ handle: fileHandle, ...parseMarkdown<'file'>(fileText) })
      database.files.add(fileRow)
    }

    const tabRow = TabRow({ leaf, view: leaf.view, containerEl: leaf.containerEl, file: fileRow })
    database.tabs.add(tabRow)
    fileRow.tabs.add(tabRow)

    // --
    // as an external effect,
    // this should really be moved to after the matcher
    // --
    const fileSettingsProxy = new Proxy({} as FileSettings, {
      get: (_, key) => tabRow.file.settings[key],
      has: (_, key) => key in tabRow.file.settings,
      set(_, key, value) {
        tabRow.file.settings[key] = value
        updateFrontmatter()
        return true
      },
      deleteProperty(_, key) {
        delete tabRow.file.settings[key]
        updateFrontmatter()
        return true
      }
    })
    const dialog = new FileSettingsDialog(database.globalSettings, fileSettingsProxy)
    tabRow.view.addAction('dot-network', 'Edit mindmap settings', dialog.open)

    function updateFrontmatter() {
      const frontmatter = isObjectEmpty(tabRow.file.settings)
        ? {} : { markmap: tabRow.file.settings }
      tabRow.view.editor.setValue(GrayMatter.stringify(tabRow.file.body, frontmatter))
    }
    // --

    return database.codeBlocksWaiting
      .filter(codeBlock => leaf.containerEl.contains(codeBlock.containerEl))
      .map(codeBlock => {
        database.codeBlocksWaiting.delete(codeBlock)
        return matcher['codeBlock created'](codeBlock)
      })
  },

  'tab changed file': ([tabLeaf, newFileHandle]) => {
    const tabRow         = database.tabs.find(row => row.leaf === tabLeaf)!
    const oldFileHandle  = tabRow.file.handle
    const oldFileRow     = database.files.find(row => row.handle === oldFileHandle)!
    const newFileRowInDb = database.files.find(row => row.handle === newFileHandle)
    let newFileRow: FileRow

    if (newFileRowInDb)
      newFileRow = newFileRowInDb
    else {
      // Create new FileRow
      const fileText = tabLeaf.view.editor.getValue()
      newFileRow = FileRow({ handle: newFileHandle, ...parseMarkdown<'file'>(fileText) })
      // Add it to the db
      database.files.add(newFileRow)
    }
    
    // Update 1-to-many relation
    tabRow.file = newFileRow
    // Remove file from files if no tab refers to it.
    const old_file_is_not_in_use = ! database.tabs.find(row => row.file.handle === oldFileHandle)
    if (old_file_is_not_in_use) database.files.delete(oldFileRow)
  },
  'tab current': tabLeaf => {
    const tabRow = database.tabs.find(row => row.leaf === tabLeaf)!
    tabRow.isCurrent = true
    return tabRow.codeBlocks.map(CodeBlockEvent.current)
  },
  'tab not current': tabLeaf => {
    const tabRow = database.tabs.find(row => row.leaf === tabLeaf)
    tabRow && (tabRow.isCurrent = false)
  },
  'tab closed': tabLeaf => {
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
  'codeBlock created': codeBlock => {
    const tabRow = database.tabs.find(tab => tab.containerEl.contains(codeBlock.containerEl))
    
    if (!tabRow) {
      database.codeBlocksWaiting.add(codeBlock)
      return
    }

    const codeBlockRow = CodeBlockRow({ codeBlock, tab: tabRow })

    database.codeBlocks.add(codeBlockRow)
    tabRow.codeBlocks.add(codeBlockRow)

    const globalSettings = database.globalSettings
    const fileSettings = tabRow.file.settings
    const isCurrent = tabRow.isCurrent
    const tabView = tabRow.view

    return CodeBlockEvent.start({ codeBlock, globalSettings, fileSettings, isCurrent, tabView, tabRow })

  },
  'codeBlock deleted': codeBlock => {
    const codeBlockRow = database.codeBlocks.find(row => row.codeBlock === codeBlock)!

    database.codeBlocks.delete(codeBlockRow)
    codeBlockRow.tab.codeBlocks.delete(codeBlockRow)

    return CodeBlockEvent.end({ codeBlock })
  },
  'fileSettings' ({ file, settings }) {
    const fileRow = database.files.find(row => row.handle === file)!
    fileRow.settings = settings

    return fileRow.tabs.flatMap(tabRow =>
      tabRow.codeBlocks.map(({ codeBlock }) =>
        CodeBlockEvent.fileSettings({ codeBlock, fileSettings: settings })
      ))
  },
  'globalSettings': globalSettings => {
    return database.codeBlocks.map(({ codeBlock }) =>
      CodeBlockEvent.globalSettings({ codeBlock, globalSettings }))
  }
}; return matcher }



const codeBlockEvent$ = Callbag.pipe(
  inputEvent$,
  filter((event): event is InputEvents['globalSettings'] => event.tag === 'globalSettings'),
  take(1),
  flatMap(({ data: globalSettings }) => {
    const database = createDb(globalSettings)
    const eventMatcher = (event: InputEvent) => match(event, matcher(database))
    return map(eventMatcher)(inputEvent$)
  }),
  Stackable.flatten
)


const renderers = new Map<CodeBlock, CodeBlockRenderer>()
Callbag.subscribe(codeBlockEvent$, event => match(event, {
  'start' ({ codeBlock, globalSettings, fileSettings, isCurrent, tabView, tabRow }) {
    const renderer = CodeBlockRenderer(codeBlock, tabView, globalSettings, fileSettings, tabRow)
    if (isCurrent) renderer.fit()
    renderers.set(codeBlock, renderer)
  },
  'current' ({ codeBlock }) {
    renderers.get(codeBlock)!.fit()
  },
  'globalSettings' ({ codeBlock, globalSettings }) {
    renderers.get(codeBlock)!.updateGlobalSettings(globalSettings)
  },
  'fileSettings' ({ codeBlock, fileSettings }) {
    renderers.get(codeBlock)!.updateFileSettings(fileSettings)
  },
  'end' ({ codeBlock }) {
    renderers.delete(codeBlock)
  }
}))
