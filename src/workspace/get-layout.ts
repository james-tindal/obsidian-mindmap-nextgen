import { TFile, WorkspaceLeaf as TabLeaf, WorkspaceParent, WorkspaceSplit, WorkspaceTabs as TabGroup } from 'obsidian'
import { ImmutableSet } from 'src/utilities/immutable-set'
import { FileTab, Tab } from './types'



export class FileMap extends Map<FileTab.Leaf, TFile> {
  diff(new_: FileMap) {
    const old = this
    const changed: [FileTab.Leaf, TFile][] = []

    for (const [leaf, old_file] of old) {
      const new_file = new_.get(leaf)
      if (new_file && new_file !== old_file)
        changed.push([leaf, new_file])
    }
    return { changed }
  }

  static diff(a: FileMap, b: FileMap) { return a.diff(b) }
}

const isFileTab = (leaf: Tab.Leaf): leaf is FileTab.Leaf => leaf.view instanceof FileTab.View

export function getLayout() {
  const tabGroups =   new ImmutableSet(getTabGroups  ())
  const tabs =        new ImmutableSet(getTabs       (tabGroups)) .filter(isFileTab)
  const currentTabs = new ImmutableSet(getCurrentTabs(tabGroups)) .filter(isFileTab)

  const files = new FileMap([...tabs.values()].map(leaf => [ leaf, leaf.view.file ]))

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

function* getTabGroups(parent: WorkspaceParent = app.workspace.rootSplit.children[0]): Generator<TabGroup> {
  if (isSplit(parent))
    for (const child of parent.children)
      yield* getTabGroups(child)
  if (isTabGroup(parent))
    yield parent
}

function isTabGroup(parent: WorkspaceParent): parent is TabGroup {
  return parent.type === 'tabs'
}

function isSplit(parent: WorkspaceParent): parent is WorkspaceSplit {
  return parent.type === 'split'
}
