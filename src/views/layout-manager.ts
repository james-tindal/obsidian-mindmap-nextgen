import { WorkspaceSplit, WorkspaceTabs, WorkspaceLeaf, TFile } from 'obsidian'
import { range } from 'ramda'
import { MM_VIEW_TYPE } from 'src/constants'
import { LeafManager } from './leaf-manager'
import { LoadingView } from './loading-view'
import MindmapTabView from './view'
import { getActiveFile } from './get-active-file'
import views from './views'
import { layout } from 'src/settings/filesystem'


export type MindmapSubject = TFile | 'unpinned'

export type Layout = Tabs | Split
type Split = (Split | Tabs)[]
type Tabs = (FlatSubject | null)[]

type Node = WorkspaceSplit | WorkspaceTabs | WorkspaceLeaf
type NodeList = WorkspaceSplit[] | WorkspaceTabs[] | WorkspaceLeaf[]

type FlatSubject =
| { type: 'unpinned' }
| { type: 'pinned', path: TFile['path'] }

export type LayoutManager = ReturnType<typeof LayoutManager>
export function LayoutManager() {
  return {
    serialise: () => layout.save(getLayout()),
    deserialise
  }

  function getLayout(): Layout {
    const topLevel = app.workspace.rootSplit.children[0] as WorkspaceSplit | WorkspaceTabs
    return loop(topLevel)
  
    function loop(node: Node): any {
      if ('children' in node) {
        const children = node.children as NodeList
        return children.map(loop)
      }
      else {
        if (node.view.getViewType() !== MM_VIEW_TYPE) return null
        const view = node.view as MindmapTabView
        const subject = views.get(view)
        if (subject) return Subject.serialise(subject)
        else         return null
      }
    }
  }

  async function deserialise(replace: LeafManager['replace']) {
    const actualLayout = app.workspace.rootSplit.children[0] as WorkspaceSplit | WorkspaceTabs
    const serialisedLayout = layout.load()
    const activeTabGroup = app.workspace.activeTabGroup!

    type Actual = WorkspaceSplit | WorkspaceTabs
    async function loop(
      serialised: Layout,
      actual: Actual
    ) {
      await match(serialised, actual, {
        async split() {
          for (const [s, a] of pairs(serialised as Split, (actual as WorkspaceSplit).children))
            await loop(s, a as Actual)
        },
        async tabs() {
          const tabs = actual as WorkspaceTabs
          const currentTabIndex = tabs.currentTab

          let queue = Promise.resolve()
          for (const [s, a] of pairs(serialised as Tabs, (actual as WorkspaceTabs).children)) {
            if (s === null || a === undefined) continue
            queue = queue.then(() => mindmap(s, a))
          }
          await queue

          // Set currentTab of each tab group
          const currentTab = tabs.children[currentTabIndex]
          app.workspace.setActiveLeaf(currentTab)
          const view = currentTab.view as MindmapTabView
          const subject = views.get(view)
          const file = subject === 'unpinned' ? getActiveFile() : subject
          if (file) view.firstRender(file)
        }
      })

      function mindmap(serialised: FlatSubject, actual: WorkspaceLeaf) {
        const subject = Subject.deserialise(serialised as FlatSubject)
        const leaf = actual as WorkspaceLeaf
        if (subject)
          return replace(leaf, subject)
      }
    }

    await loop(serialisedLayout, actualLayout)  // All tab groups done loading

    const activeLeaf = activeTabGroup.children[activeTabGroup.currentTab]
    app.workspace.setActiveLeaf(activeLeaf)

    LoadingView.closeAll()

    await undefined
  }
}

type Matcher = {
  split: () => Promise<void>
  tabs: () => Promise<void>
}

async function match(
  serialised: Split | Tabs,
  actual: WorkspaceSplit | WorkspaceTabs,
  matcher: Matcher
) {
  const type = {
    serialised: Array.isArray(serialised?.[0]) ? 'split' : 'tabs',
    actual: actual.type
  }

  if (type.serialised !== type.actual) return
  const match = type.serialised
  await matcher[match]()
}

function* pairs<A, B>(a: A[], b: B[]): Generator<[A, B | undefined]> {
  for (const index of range(0, a.length))
    yield [a[index], b[index]]
}


abstract class Subject {
  static serialise(subject: MindmapSubject): FlatSubject {
    if (subject === 'unpinned')
      return { type: 'unpinned' }
    else
      return { type: 'pinned', path: subject.path }
  }
  static deserialise(fs: FlatSubject): MindmapSubject | undefined {
    if (fs.type === 'unpinned')
      return 'unpinned'
    else
      return app.vault.getMarkdownFiles().find(tfile => tfile.path === fs.path)
  }
}
