import { TFile, MarkdownView, MarkdownFileInfo, WorkspaceLeaf, WorkspaceSplit, WorkspaceTabs, Editor, TAbstractFile } from 'obsidian'
import { layoutManager } from './layout-manager'
import { LoadingView } from './loading-view'
import MindmapTabView from './view'
import { getActiveFile } from './get-active-file'
import views from './views'
import { globalSettings } from 'src/settings/filesystem'
import { setViewCreator } from './view-creator'
import { leafManager } from './leaf-manager'
import { layoutChange, start } from 'src/core/events'
import Callbag from 'src/utilities/callbag'


Callbag.subscribe(start, () =>
  setViewCreator((leaf: WorkspaceLeaf) => new LoadingView(leaf)))

Callbag.subscribe(layoutChange, () => {
  layoutManager.serialise()

  const topLevel = app.workspace.rootSplit.children[0] as WorkspaceSplit | WorkspaceTabs;

  (function loop(parent: WorkspaceSplit | WorkspaceTabs) {
    if (parent.type === 'split')
      parent.children.map(loop)
    else {
      const currentTab = parent.children[parent.currentTab]
      const view = currentTab.view
      const loaded = view instanceof MindmapTabView
      if (!loaded) return
      const subject = views.get(view)!
      const file = subject === 'unpinned' ? getActiveFile() : subject
      if (file) view.firstRender(file)
    }
  })(topLevel)
})

export const eventListeners = {
  viewRequest: {
    'hotkey-open-unpinned' () {
      const activeFile = getActiveFile()
      if (activeFile === null) return

      if (views.has('unpinned'))
        leafManager.reveal('unpinned')
      else
        leafManager.new('unpinned')
    },

    'hotkey-open-pinned' () {
      const activeFile = getActiveFile()
      if (activeFile === null) return

      if (views.has(activeFile))
        leafManager.reveal(activeFile)
      else
        leafManager.new(activeFile)
    },

    'menu-pin' () {
      const activeFile = getActiveFile()!
      if (views.has(activeFile)) {
        leafManager.close(activeFile)
        leafManager.replace('unpinned', activeFile)
      }
      else
        leafManager.replace('unpinned', activeFile)
    },

    'menu-unpin' (file: TFile) {
      if (views.has('unpinned')) {
        leafManager.close('unpinned')
        leafManager.replace(file, 'unpinned')
      }
      else
        leafManager.replace(file, 'unpinned')
    }
  },

  editorChange(editor: Editor, { file }: MarkdownView | MarkdownFileInfo) {
    file = file!

    if (file.extension !== 'md') return

    const content = editor.getValue()

    if (views.has(file)) {
      const view = views.get(file)!
      view.render(file, content)
    }

    if (views.has('unpinned')) {
      const view = views.get('unpinned')!
      view.render(file, content)
    }
  },

  fileOpen(file: TFile | null) {
    if (file?.extension !== 'md') return

    if (views.has(file)) {
      const view = views.get(file)!
      view.render(file)
    }

    if (views.has('unpinned')) {
      const view = views.get('unpinned')!
      view.render(file)
    }
  },

  renameFile({ path }: TAbstractFile) {
    const activeFile = getActiveFile()
    const unpinned = views.get('unpinned')
    if (unpinned && activeFile?.path === path && globalSettings.titleAsRootNode)
      unpinned.render(activeFile)

    const result = views.getByPath(path)
    if (result) {
      const { view, file } = result
      view.setDisplayText(file.basename)
      view.render(file)
    }
  }
}
