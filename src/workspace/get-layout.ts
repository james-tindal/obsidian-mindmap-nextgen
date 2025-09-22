import { TFile, WorkspaceLeaf as TabLeaf, WorkspaceSplit, WorkspaceTabs as TabGroup, WorkspaceItem, MarkdownView } from 'obsidian'
import { ImmutableSet } from 'src/utilities/immutable-set'
import { MarkdownTab, leafHasFile, Tab } from './types'
import { assert } from './types'



export class FileMap extends Map<MarkdownTab.Leaf, TFile> {
  diff(new_: FileMap) {
    const old = this
    const changed: [MarkdownTab.Leaf, TFile][] = []

    for (const [leaf, old_file] of old) {
      const new_file = new_.get(leaf)
      if (new_file && new_file !== old_file)
        changed.push([leaf, new_file])
    }
    return { changed }
  }

  static diff(a: FileMap, b: FileMap) { return a.diff(b) }
}

const isFileTab = (leaf: Tab.Leaf): leaf is MarkdownTab.Leaf => leaf.view instanceof MarkdownView

export function getLayout() {
  const tabGroups =   new ImmutableSet(getTabGroups  ())
  const tabs =        new ImmutableSet(getTabs       (tabGroups)) .filter(isFileTab)
  const currentTabs = new ImmutableSet(getCurrentTabs(tabGroups)) .filter(isFileTab)

  const files = new FileMap([...tabs.values()].map(leaf => {
    assert(leafHasFile, leaf)
    return [ leaf, leaf.view.file ]
  }))

  return { tabs, currentTabs, files }
}


function* getTabs(tabGroups: Iterable<TabGroup>): Generator<TabLeaf, void, undefined> {
  for (const group of tabGroups)
    yield* group.children
}

function* getCurrentTabs(tabGroups: Iterable<TabGroup>) {
  for (const group of tabGroups) {
    yield group.children[group.currentTab]
  }
}

function* getTabGroups(item: WorkspaceItem = app.workspace.rootSplit.children[0]): Generator<TabGroup> {
  if (isSplit(item))
    for (const child of item.children)
      yield* getTabGroups(child)
  if (isTabGroup(item))
    yield item
}

function isTabGroup(item: WorkspaceItem): item is TabGroup {
  return item.type === 'tabs'
}

function isSplit(item: WorkspaceItem): item is WorkspaceSplit {
  return item.type === 'split'
}
