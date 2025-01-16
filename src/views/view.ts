import { ItemView, Menu, WorkspaceLeaf } from 'obsidian'

import { GlobalSettings } from 'src/settings/filesystem'
import { MM_VIEW_TYPE } from 'src/constants'
import { TabRenderer } from 'src/rendering/renderer-tab'


export default class MindmapTabView extends ItemView {
  private displayText: string
  private pinned: boolean
  
  private renderer: TabRenderer
  public render: TabRenderer['render']
  public firstRender: TabRenderer['firstRender']

  constructor(settings: GlobalSettings, leaf: WorkspaceLeaf, displayText: string, pinned: boolean) {
    super(leaf)
    this.displayText = displayText
    this.pinned = pinned

    this.renderer = TabRenderer(this.containerEl, settings)
    this.render = this.renderer.render
    this.firstRender = this.renderer.firstRender
  }

  private static pinToggleListener: (view: MindmapTabView) => void
  public static onPinToggle(listener: (view: MindmapTabView) => void) {
    MindmapTabView.pinToggleListener = listener
  }
  private togglePinned() {
    MindmapTabView.pinToggleListener(this)
  }

  public getViewType() { return MM_VIEW_TYPE };
  public getDisplayText() { return this.displayText };
  public getIcon() { return 'dot-network' };

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
