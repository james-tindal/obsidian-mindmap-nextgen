import { ViewCreator, WorkspaceLeaf } from 'obsidian'
import { MM_VIEW_TYPE } from 'src/constants'
import { MindmapSubject } from './layout-manager'
import MindmapView from './view'
import { plugin } from 'src/core/entry'
import { getActiveFile } from './get-active-file'
import views from './views'

let viewCreator!: ViewCreator
export function setViewCreator(vc: ViewCreator) { viewCreator = vc }
plugin.registerView(MM_VIEW_TYPE, (leaf: WorkspaceLeaf) => viewCreator(leaf))

export function constructView(leaf: WorkspaceLeaf, subject: MindmapSubject) {
  return enqueue(async () => {
    const pinned = subject !== 'unpinned'
    const displayText = pinned ? subject.basename : 'Mindmap'

    viewCreator = () => {
      const view = new MindmapView(leaf, displayText, pinned)
      views.set(subject, view)
      return view
    }
    await leaf.setViewState({ type: MM_VIEW_TYPE, active: true })

    const view = leaf.view as MindmapView
    const file = pinned ? subject : getActiveFile()

    waitUntilActive(leaf)
    .then(() =>
      file && view.firstRender(file))
  })
}

let waitForLastConstruct = Promise.resolve()
function enqueue(onfulfilled: () => Promise<void>) {
  return waitForLastConstruct = waitForLastConstruct.then(onfulfilled)
}

const waitUntilActive = (leaf: WorkspaceLeaf) =>
  new Promise<void>(resolve => {
    const listener =
      app.workspace.on('active-leaf-change', activeLeaf => {
        if (activeLeaf === leaf) {
          resolve()
          app.workspace.offref(listener)
        }
      })
    plugin.registerEvent(listener)
  })
