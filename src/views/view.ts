import { ItemView, Menu, TFile, ViewStateResult, WorkspaceLeaf } from 'obsidian'

import { MM_VIEW_TYPE } from 'src/constants'
import { TabRenderer } from 'src/rendering/renderer-tab'


type LayoutState = { pinned: boolean, filePath: string }
type LiveState   = { pinned: boolean, file: TFile }

export default class MindmapTabView extends ItemView {
  private displayText: string
  public pinned: boolean
  public file: TFile
  
  private renderer: TabRenderer
  public render: TabRenderer['render']
  public firstRender: TabRenderer['firstRender']

  constructor(leaf: WorkspaceLeaf) {
    super(leaf)

    this.renderer = TabRenderer(this.containerEl)
    this.render = this.renderer.render
    this.firstRender = this.renderer.firstRender
  }

  getState(): LayoutState {
    return {
      pinned: this.pinned,
      filePath: this.file.path
    }
  }
  setState(state: LayoutState | LiveState, result: ViewStateResult): Promise<void> {
    console.log('view setState', state, this)

    const file = 
      'file' in state ? state.file :
      app.vault.getAbstractFileByPath(state.filePath) 
    if (file instanceof TFile) {
      this.file = file
      this.setDisplayText(file.basename)
      this.firstRender(file)
    }
    this.pinned = state.pinned
    return super.setState(state, result)
  }

  private static pinToggleListener: (view: MindmapTabView) => void
  public static onPinToggle(listener: (view: MindmapTabView) => void) {
    MindmapTabView.pinToggleListener = listener
  }
  private togglePinned() {
    MindmapTabView.pinToggleListener(this)
  }

  public getViewType() { return MM_VIEW_TYPE }
  public getDisplayText() { return this.displayText }
  public getIcon() { return 'dot-network' }

  public setDisplayText(displayText: string) {
    this.displayText = displayText
    this.leaf.updateHeader()
  }

  public onPaneMenu(menu: Menu, source: string) {
    const { collapseAll, toolbar, takeScreenshot } = this.renderer
    menu
      .addItem(item => item
        .setIcon('pin')
        .setTitle(this.pinned ? 'Unpin' : 'Pin')
        .onClick(() => this.togglePinned())
      )
      .addItem(item => item
        .setIcon('image-file')
        .setTitle('Copy screenshot')
        .onClick(takeScreenshot)
      )
      .addItem(item => item
        .setIcon('folder')
        .setTitle('Collapse all')
        .onClick(collapseAll)
      )
      .addItem(item => item
        .setIcon('view')
        .setTitle(`${toolbar.hidden ? 'Show' : 'Hide'} toolbar`)
        .onClick(toolbar.toggle)
      )

    super.onPaneMenu(menu, source)
  }
}
