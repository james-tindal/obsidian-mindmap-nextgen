import { WorkspaceLeaf, WorkspaceSplit, WorkspaceTabs, WorkspaceParent, SplitDirection } from 'obsidian'
import { MindmapSubject } from './layout-manager'
import { ViewCreatorManager } from './view-creator-manager'
import { Views } from './view-manager'

export type LeafManager = ReturnType<typeof LeafManager>
export function LeafManager(views: Views, createLeafIn: CreateLeafIn, constructView: ViewCreatorManager['constructView']) {
  return {
    close,
    reveal,
    replace,
    new(subject: MindmapSubject) {
      const leaf = newLeaf()
      constructView(leaf, subject)
    },
  }

  async function replace(remove: MindmapSubject | WorkspaceLeaf, add: MindmapSubject) {
    const leafToRemove = isLeaf(remove) ? remove : views.get(remove)!.leaf
    const tabGroup = leafToRemove.parent
    const index = tabGroup.children.indexOf(leafToRemove)

    const newLeaf = createLeafIn.tabGroup(tabGroup, index)

    await constructView(newLeaf, add)
    leafToRemove.detach()
  }

  function isLeaf(msl: MindmapSubject | WorkspaceLeaf): msl is WorkspaceLeaf {
    return msl instanceof WorkspaceLeaf
  }

  function close(subject: MindmapSubject) {
    const view = views.get(subject)!
    view.leaf.detach()
  }

  function reveal(subject: MindmapSubject) {
    const view = views.get(subject)!
    app.workspace.setActiveLeaf(view.leaf)
  }

  function newLeaf() {
    const topLevel = app.workspace.rootSplit.children[0] as WorkspaceSplit | WorkspaceTabs
    const topLevelSplit = topLevel.type === 'split'
    const noSplit = !topLevelSplit

    if (noSplit)
      return createLeafIn.newSplit()
    
    const activeLeaf = app.workspace.activeLeaf!
    const thisTabGroup = activeLeaf.parent
    const parentSplit = thisTabGroup.parent as WorkspaceSplit
    const isTabGroup = (parent: WorkspaceParent): parent is WorkspaceTabs =>
      parent.type === 'tabs'
    const notParentOfActiveLeaf = (tabGroup: WorkspaceTabs) =>
      !tabGroup.children.includes(activeLeaf)
    const siblingTabGroup = parentSplit.children
      .find(parent => isTabGroup(parent) && notParentOfActiveLeaf(parent)) as WorkspaceTabs | undefined

    if (siblingTabGroup)
      return createLeafIn.tabGroup(siblingTabGroup, -1)
    else
      return createLeafIn.tabGroup(thisTabGroup, thisTabGroup.children.indexOf(activeLeaf) + 1)
  }
}


export type CreateLeafIn = ReturnType<typeof CreateLeafIn>
export function CreateLeafIn(splitDirection: SplitDirection) {
  return {
    tabGroup: (tabGroup: WorkspaceTabs, index: number) =>
        app.workspace
          .createLeafInParent(tabGroup, index),

    newSplit: () =>
        app.workspace
          .getLeaf('split', splitDirection)
  }
}