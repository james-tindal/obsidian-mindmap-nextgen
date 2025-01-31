import { TFile, MarkdownView, MarkdownFileInfo, WorkspaceLeaf, WorkspaceSplit, WorkspaceTabs, Editor, TAbstractFile } from 'obsidian'
import { GlobalSettings } from 'src/settings/filesystem'
import { LayoutManager } from './layout-manager'
import { LeafManager } from './leaf-manager'
import { LoadingView } from './loading-view'
import MindmapTabView from './view'
import { ViewCreatorManager } from './view-creator-manager'
import { getActiveFile, Views } from './view-manager'

export type EventListeners = {
  appLoading(setViewCreator: ViewCreatorManager['setViewCreator']): void;
  layoutReady(): Promise<void>;
  layoutChange(): void;
  viewRequest: {
    'hotkey-open-unpinned'()           : void;
    'hotkey-open-pinned'  ()           : void;
    'menu-pin'            ()           : void;
    'menu-unpin'          (file: TFile): void;
  }
  editorChange(editor: Editor, info: MarkdownView | MarkdownFileInfo): any;
  fileOpen(file: TFile | null): void;
  renameFile(file: TAbstractFile, oldPath: string): void;
}
export function EventListeners(views: Views, settings: GlobalSettings, layoutManager: LayoutManager, leafManager: LeafManager): EventListeners { return {
  appLoading(setViewCreator: ViewCreatorManager['setViewCreator']) {
    setViewCreator((leaf: WorkspaceLeaf) => new LoadingView(leaf))
  },

  layoutReady() {
    return layoutManager.deserialise(leafManager.replace, views)
  },

  layoutChange() {
    layoutManager.serialise(views)

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
  },

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

    'menu-unpin' (file) {
      if (views.has('unpinned')) {
        leafManager.close('unpinned')
        leafManager.replace(file, 'unpinned')
      }
      else
        leafManager.replace(file, 'unpinned')
    }
  },

  editorChange(editor, { file }) {
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

  fileOpen(file) {
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

  renameFile({ path }) {
    const activeFile = getActiveFile()
    const unpinned = views.get('unpinned')
    if (unpinned && activeFile?.path === path && settings.titleAsRootNode)
      unpinned.render(activeFile)

    const result = views.getByPath(path)
    if (result) {
      const { view, file } = result
      view.setDisplayText(file.basename)
      view.render(file)
    }
  }
}}
