import { MarkdownView, TFile } from 'obsidian'
import GrayMatter from 'gray-matter'

import { FileSettings } from 'src/settings/filesystem'
import Callbag, { filter, flatMap, map, merge, pairwise, Source, startWith } from 'src/utilities/callbag'
import { ImmutableSet } from 'src/utilities/immutable-set'
import { FileMap, getLayout } from './get-layout'
import { CodeBlockRow, FileRow, TabRow } from './db-schema'
import { MarkdownTab, leafHasFile } from './types'
import { CodeBlockRenderer } from 'src/rendering/renderer-codeblock'
import { isObjectEmpty } from 'src/utilities/utilities'
import { ExtractRecord, ExtractUnion, Matcher, Stackable, Tagged, match, tr, unionConstructors } from './utilities'
import { assert } from './types'
import { parseMarkdown } from 'src/rendering/renderer-common'
import { FileSettingsDialog } from 'src/settings/dialogs'
import { workspace } from 'src/core/entry'
import { fromObsidianEvent } from 'src/utilities/from-obsidian-event'
import { Merge } from 'type-fest'
import { CodeBlock, codeBlockCreated, codeBlockDeleted } from 'src/new/codeBlockHandler'


const InputEvent = unionConstructors(
  Tagged('codeBlock created', tr as CodeBlock),
  Tagged('codeBlock deleted', tr as CodeBlock),
  Tagged('tab opened',      tr as MarkdownTab.Leaf),
  Tagged('tab closed',      tr as MarkdownTab.Leaf),
  Tagged('tab current',     tr as MarkdownTab.Leaf),
  Tagged('tab not current', tr as MarkdownTab.Leaf),
  Tagged('tab changed file', tr as [ MarkdownTab.Leaf, TFile ]),
  Tagged('fileSettings',     tr as { file: TFile, settings: FileSettings }),
)
type InputEvent = ExtractUnion<typeof InputEvent>
type InputEvents = ExtractRecord<typeof InputEvent>

const CodeBlockEvent = unionConstructors(
  Tagged('start',          tr as { codeBlock: CodeBlock, fileSettings: FileSettings, isCurrent: boolean, markdownView: MarkdownView, fileRow: FileRow }),
  Tagged('current',        tr as { codeBlock: CodeBlock }),
  Tagged('fileSettings',   tr as { codeBlock: CodeBlock, fileSettings: FileSettings }),
  Tagged('end',            tr as { codeBlock: CodeBlock }),
)
type CodeBlockEvent = ExtractUnion<typeof CodeBlockEvent>

const codeBlock$ = Callbag.merge(
  map(InputEvent['codeBlock created'])(codeBlockCreated),
  map(InputEvent['codeBlock deleted'])(codeBlockDeleted),
)

const layoutChange$ = Callbag.merge(
  fromObsidianEvent(app.workspace, 'layout-change'),
  fromObsidianEvent(app.workspace, 'active-leaf-change')
)

const layout$ = Callbag.pipe(
  layoutChange$,
  map(getLayout),
  startWith({ tabs: new ImmutableSet<MarkdownTab.Leaf>, currentTabs: new ImmutableSet<MarkdownTab.Leaf>, files: new FileMap }),
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

const fileChange$ = Callbag.pipe(
  fromObsidianEvent(app.metadataCache, 'changed'),
  map(([file, data, cache]) => ({ file, data, cache }))
)

const file$ = Callbag.pipe(
  fileChange$,
  map(({ cache, data, file }) => ({ file, frontmatter: cache.frontmatter as object, body: data.slice(cache.frontmatterPosition?.start.offset) }))
)

const fileSettings$ = Callbag.pipe(fileChange$,
  map(({ file, cache }) => ({ file, settings: (cache.frontmatter as { markmap?: FileSettings } | undefined)?.markmap })),
  filter((x): x is Merge<typeof x, { settings: FileSettings }> =>
    'settings' in x && typeof x.settings === 'object'),
  map(InputEvent.fileSettings)
)

const inputEvent$: Source<InputEvent> = Callbag.share(merge(layout$, codeBlock$, fileSettings$))

type EventMatcher = Matcher<InputEvent, Stackable<CodeBlockEvent>>

const matcher: EventMatcher = {
  'tab opened': leaf => {
    assert(leafHasFile, leaf)
    const fileHandle = leaf.view.file
    const fileRowInDb = workspace.files.find(row => row.handle === fileHandle)
    let fileRow: FileRow

    if (fileRowInDb)
      fileRow = fileRowInDb
    else {
      const fileText = leaf.view.editor.getValue()
      fileRow = FileRow({ handle: fileHandle, ...parseMarkdown<'file'>(fileText) })
      workspace.files.add(fileRow)
    }

    const tabRow = TabRow({ leaf, view: leaf.view, containerEl: leaf.containerEl, file: fileRow })
    workspace.tabs.add(tabRow)
    fileRow.tabs.add(tabRow)

    // --
    // as an external effect,
    // this should really be moved to after the matcher
    // --
    const fileSettingsProxy = new Proxy({} as FileSettings, {
      get: (_, key: keyof FileSettings) => tabRow.file.settings[key],
      has: (_, key) => key in tabRow.file.settings,
      set<Key extends keyof FileSettings>(_: unknown, key: Key, value: FileSettings[Key]) {
        tabRow.file.settings[key] = value
        updateFrontmatter()
        return true
      },
      deleteProperty(_, key: keyof FileSettings) {
        delete tabRow.file.settings[key]
        updateFrontmatter()
        return true
      }
    })
    const dialog = new FileSettingsDialog(fileSettingsProxy)
    tabRow.view.addAction('dot-network', 'Edit mindmap settings', dialog.open)

    function updateFrontmatter() {
      const frontmatter = isObjectEmpty(tabRow.file.settings)
        ? {} : { markmap: tabRow.file.settings }
      tabRow.view.editor.setValue(GrayMatter.stringify(tabRow.file.body, frontmatter))
    }
    // --

    return workspace.codeBlocksWaiting
      .filter(codeBlock => leaf.containerEl.contains(codeBlock.containerEl))
      .map(codeBlock => {
        matcher
        workspace.codeBlocksWaiting.delete(codeBlock)
        // @ts-expect-error: Don't know what's going on with these types but this is obviously fine
        return matcher['codeBlock created'](codeBlock)
      })
  },

  'tab changed file': ([tabLeaf, newFileHandle]) => {
    const tabRow         = workspace.tabs.find(row => row.leaf === tabLeaf)!
    const oldFileHandle  = tabRow.file.handle
    const oldFileRow     = workspace.files.find(row => row.handle === oldFileHandle)!
    const newFileRowInDb = workspace.files.find(row => row.handle === newFileHandle)
    let newFileRow: FileRow

    if (newFileRowInDb)
      newFileRow = newFileRowInDb
    else {
      // Create new FileRow
      const fileText = tabLeaf.view.editor.getValue()
      newFileRow = FileRow({ handle: newFileHandle, ...parseMarkdown<'file'>(fileText) })
      // Add it to the db
      workspace.files.add(newFileRow)
    }
    
    // Update 1-to-many relation
    tabRow.file = newFileRow
    // Remove file from files if no tab refers to it.
    const old_file_is_not_in_use = ! workspace.tabs.find(row => row.file.handle === oldFileHandle)
    if (old_file_is_not_in_use) workspace.files.delete(oldFileRow)
  },
  'tab current': tabLeaf => {
    const tabRow = workspace.tabs.find(row => row.leaf === tabLeaf)!
    tabRow.isCurrent = true
    return tabRow.codeBlocks.map(CodeBlockEvent.current)
  },
  'tab not current': tabLeaf => {
    const tabRow = workspace.tabs.find(row => row.leaf === tabLeaf)
    tabRow && (tabRow.isCurrent = false)
  },
  'tab closed': tabLeaf => {
    const tabRow = workspace.tabs.find(row => row.leaf === tabLeaf)!
    const fileRow = tabRow.file

    // remove tab from db.tabs
    workspace.tabs.delete(tabRow)

    // remove tab from db.files
    workspace.files.forEach(fileRow => fileRow.tabs.delete(tabRow))

    // remove file if it has no tabs
    workspace.tabs.find(row => row.file === fileRow)

    // codeBlocks will each have their own delete events
  },
  'codeBlock created': codeBlock => {
    const tabRow = workspace.tabs.find(tab => tab.containerEl.contains(codeBlock.containerEl))
    
    if (!tabRow) {
      workspace.codeBlocksWaiting.add(codeBlock)
      return
    }

    const codeBlockRow = CodeBlockRow({ codeBlock, tab: tabRow })

    workspace.codeBlocks.add(codeBlockRow)
    tabRow.codeBlocks.add(codeBlockRow)

    const fileSettings = tabRow.file.settings
    const isCurrent = tabRow.isCurrent
    const tabView = tabRow.view
    const fileRow = tabRow.file

    return CodeBlockEvent.start({ codeBlock, fileSettings, isCurrent, markdownView: tabView, fileRow })

  },
  'codeBlock deleted': codeBlock => {
    const codeBlockRow = workspace.codeBlocks.find(row => row.codeBlock === codeBlock)!

    workspace.codeBlocks.delete(codeBlockRow)
    codeBlockRow.tab.codeBlocks.delete(codeBlockRow)

    return CodeBlockEvent.end({ codeBlock })
  },
  'fileSettings' ({ file, settings }) {
    const fileRow = workspace.files.find(row => row.handle === file)!
    fileRow.settings = settings

    return fileRow.tabs.flatMap(tabRow =>
      tabRow.codeBlocks.map(({ codeBlock }) =>
        CodeBlockEvent.fileSettings({ codeBlock, fileSettings: settings })
      ))
  }
}


const codeBlockEvent$ = Callbag.pipe(
  inputEvent$,
  map((event: InputEvent) => match(event, matcher)),
  Stackable.flatten
)


const renderers = new Map<CodeBlock, CodeBlockRenderer>()
Callbag.subscribe(codeBlockEvent$, event => match(event, {
  'start' ({ codeBlock, fileSettings, isCurrent, markdownView, fileRow }) {
    const renderer = CodeBlockRenderer(codeBlock, markdownView, fileSettings, fileRow)
    if (isCurrent) renderer.fit()
    renderers.set(codeBlock, renderer)
  },
  'current' ({ codeBlock }) {
    renderers.get(codeBlock)!.fit()
  },
  'fileSettings' ({ codeBlock, fileSettings }) {
    renderers.get(codeBlock)!.updateFileSettings(fileSettings)
  },
  'end' ({ codeBlock }) {
    renderers.delete(codeBlock)
  }
}))
