import { ItemView, Menu, WorkspaceLeaf } from "obsidian";

import { PluginSettings } from "src/filesystem";
import { MM_VIEW_TYPE } from "src/constants"
import { Renderer } from "src/rendering/renderer-view";


export default class View extends ItemView {
  private displayText: string;
  private pinned: boolean;
  private renderer: Renderer;
  
  public isView = true;

  public render: Renderer['render'];
  public firstRender: Renderer['firstRender'];

  constructor(settings: PluginSettings, leaf: WorkspaceLeaf, displayText: string, pinned: boolean) {
    super(leaf);
    this.displayText = displayText;
    this.pinned = pinned;

    this.renderer = Renderer(this.containerEl, settings);
    this.render = this.renderer.render;
    this.firstRender = this.renderer.firstRender;
  }

  private static pinToggleListener: (view: View) => void;
  public static onPinToggle(listener: (view: View) => void) {
    View.pinToggleListener = listener;
  }
  private togglePinned() {
    View.pinToggleListener(this)
  }

  public getViewType() { return MM_VIEW_TYPE };
  public getDisplayText() { return this.displayText };
  public getIcon() { return "dot-network" };

  public setDisplayText(displayText: string) {
    this.displayText = displayText;
    this.leaf.updateHeader();
  }

  public static isView(x: any): x is View {
    return typeof x === "object"
        && "isView" in x
        && x.isView === true;
  }

  private onMoreOptionsMenu(menu: Menu) {
    const { collapseAll, toolbar, takeScreenshot } = this.renderer;
    menu
      .addItem((item) => item
        .setIcon("pin")
        .setTitle(this.pinned ? "Unpin" : "Pin")
        .onClick(() => this.togglePinned())
      )
      .addItem((item) => item
        .setIcon("image-file")
        .setTitle("Copy screenshot")
        .onClick(takeScreenshot)
      )
      .addItem((item) => item
        .setIcon("folder")
        .setTitle("Collapse all")
        .onClick(collapseAll)
      )
      .addItem((item) => item
        .setIcon("view")
        .setTitle(`${toolbar.hidden ? "Show" : "Hide"} toolbar`)
        .onClick(toolbar.toggle)
      );

    menu.showAtPosition({ x: 0, y: 0 });
  }
}
