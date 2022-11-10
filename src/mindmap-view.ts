import {
  EventRef,
  ItemView,
  Menu,
  Vault,
  Workspace,
  WorkspaceLeaf,
} from "obsidian";
import { transform } from "markmap-lib";
import { Markmap } from "markmap-view";
import { INode } from "markmap-common";
import { FRONT_MATTER_REGEX, MD_VIEW_TYPE, MM_VIEW_TYPE } from "./constants";
import ObsidianMarkmap from "./obsidian-markmap-plugin";
import { createSVG, getComputedCss, removeExistingSVG } from "./markmap-svg";
import { copyImageToClipboard } from "./copy-image";
import { MindMapSettings } from "./settings";
import { IMarkmapOptions } from "markmap-view/types/types";
import { D3ZoomEvent, ZoomTransform, zoomIdentity } from "d3-zoom";

export default class MindmapView extends ItemView {
  filePath: string;
  fileName: string;
  linkedLeaf: WorkspaceLeaf;
  displayText: string;
  currentMd: string;
  vault: Vault;
  workspace: Workspace;
  listeners: EventRef[];
  emptyDiv: HTMLDivElement;
  svg: SVGElement;
  obsMarkmap: ObsidianMarkmap;
  isLeafPinned: boolean;
  pinAction: HTMLElement;
  settings: MindMapSettings;
  currentTransform: ZoomTransform;
  markmapSVG: Markmap;

  // workaround for zooming

  getViewType(): string {
    return MM_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.displayText ?? "Mind Map";
  }

  getIcon() {
    return "dot-network";
  }

  onMoreOptionsMenu(menu: Menu) {
    menu
      .addItem((item) =>
        item
          .setIcon("pin")
          .setTitle("Pin")
          .onClick(() => this.pinCurrentLeaf())
      )
      .addSeparator()
      .addItem((item) =>
        item
          .setIcon("image-file")
          .setTitle("Copy screenshot")
          .onClick(() => copyImageToClipboard(this.svg))
      );
    menu.showAtPosition({ x: 0, y: 0 });
  }

  constructor(
    settings: MindMapSettings,
    leaf: WorkspaceLeaf,
    initialFileInfo: { path: string; basename: string }
  ) {
    super(leaf);
    console.log("settings", settings);
    this.settings = settings;
    this.filePath = initialFileInfo.path;
    this.fileName = initialFileInfo.basename;
    this.vault = this.app.vault;
    this.workspace = this.app.workspace;
  }

  async onOpen() {
    this.obsMarkmap = new ObsidianMarkmap(this.vault);
    this.registerActiveLeafUpdate();
    this.listeners = [
      this.workspace.on("layout-change", () => this.update()),
      this.workspace.on("resize", () => this.update()),
      this.workspace.on("css-change", () => this.update()),
      this.leaf.on("group-change", (group) =>
        this.updateLinkedLeaf(group, this)
      ),
    ];
  }

  async onClose() {
    this.listeners.forEach((listener) => this.workspace.offref(listener));
  }

  registerActiveLeafUpdate() {
    this.registerInterval(
      window.setInterval(() => this.checkAndUpdate(), 1000)
    );
  }

  async checkAndUpdate() {
    try {
      if (await this.checkActiveLeaf()) {
        this.update();
      }
    } catch (error) {
      console.error(error);
    }
  }

  updateLinkedLeaf(group: string, mmView: MindmapView) {
    if (group === null) {
      mmView.linkedLeaf = undefined;
      return;
    }
    const mdLinkedLeaf = mmView.workspace
      .getGroupLeaves(group)
      .filter((l) => l.view.getViewType() === MM_VIEW_TYPE)[0];
    mmView.linkedLeaf = mdLinkedLeaf;
    this.checkAndUpdate();
  }

  pinCurrentLeaf() {
    this.isLeafPinned = true;
    this.pinAction = this.addAction(
      "filled-pin",
      "Pin",
      () => this.unPin(),
      20
    );
    this.pinAction.addClass("is-active");
  }

  unPin() {
    this.isLeafPinned = false;
    this.pinAction.parentNode.removeChild(this.pinAction);
  }

  async update() {
    if (this.filePath) {
      await this.readMarkDown();
      if (
        this.currentMd.length === 0 ||
        this.getLeafTarget().view.getViewType() != MD_VIEW_TYPE
      ) {
        this.displayEmpty(true);
        removeExistingSVG();
      } else {
        const { root, features } = await this.transformMarkdown();
        this.displayEmpty(false);

        this.svg = createSVG(this.containerEl, this.settings.lineHeight);

        this.renderMarkmap(root, this.svg);
      }
    }
    this.displayText =
      this.fileName != undefined ? `Mind Map of ${this.fileName}` : "Mind Map";
    this.load();
  }

  async checkActiveLeaf() {
    if (this.app.workspace.activeLeaf.view.getViewType() === MM_VIEW_TYPE) {
      return false;
    }
    const pathHasChanged = this.readFilePath();
    const markDownHasChanged = await this.readMarkDown();
    const updateRequired = pathHasChanged || markDownHasChanged;
    return updateRequired;
  }

  readFilePath() {
    const fileInfo = (this.getLeafTarget().view as any).file;
    const pathHasChanged = this.filePath != fileInfo.path;
    this.filePath = fileInfo.path;
    this.fileName = fileInfo.basename;
    return pathHasChanged;
  }

  getLeafTarget() {
    if (!this.isLeafPinned) {
      this.linkedLeaf = this.app.workspace.activeLeaf;
    }
    return this.linkedLeaf != undefined
      ? this.linkedLeaf
      : this.app.workspace.activeLeaf;
  }

  async readMarkDown() {
    let md = await this.app.vault.adapter.read(this.filePath);
    if (md.startsWith("---")) {
      md = md.replace(FRONT_MATTER_REGEX, "");
    }
    const markDownHasChanged = this.currentMd != md;
    this.currentMd = md;
    return markDownHasChanged;
  }

  async transformMarkdown() {
    const { root, features } = transform(this.currentMd);
    this.obsMarkmap.updateInternalLinks(root);
    return { root, features };
  }

  applyColor({ d: depth }: INode) {
    console.log("uaauu", this);
    const colors = [
      this.settings.color1,
      this.settings.color2,
      this.settings.color3,
    ];

    const selectedColor = colors[depth % colors.length];

    return selectedColor ? selectedColor : this.settings.defaultColor;
  }

  async renderMarkmap(root: INode, svg: SVGElement) {
    const { font } = getComputedCss(this.containerEl);
    const options: IMarkmapOptions = {
      autoFit: false,
      color: this.applyColor.bind(this),
      duration: 10,
      nodeFont: font,
      nodeMinHeight: this.settings.nodeMinHeight ?? 16,
      spacingVertical: this.settings.spacingVertical ?? 5,
      spacingHorizontal: this.settings.spacingHorizontal ?? 80,
      paddingX: this.settings.paddingX ?? 8,
    };
    try {
      let hasAppliedZoom = false;
      const previousTransform = this.currentTransform;

      this.markmapSVG = Markmap.create(svg, options, root);

      this.markmapSVG.zoom.on(
        "start.keeper",
        (evt: D3ZoomEvent<SVGElement, any>) => {
          if (previousTransform && hasAppliedZoom) {
            const { x, y, k } = previousTransform;
            evt.transform.translate(x, y).scale(k);
          }
        }
      );

      this.markmapSVG.zoom.on(
        "end.keeper",
        (evt: D3ZoomEvent<SVGElement, any>) => {
          if (previousTransform && !hasAppliedZoom) {
            hasAppliedZoom = true;
            const { x, y, k } = previousTransform;

            this.markmapSVG.zoom.transform(
              this.markmapSVG.svg,
              zoomIdentity.translate(x, y).scale(k)
            );
          } else {
            this.currentTransform = evt.transform;
          }
        }
      );
    } catch (error) {
      console.error(error);
    }
  }

  displayEmpty(display: boolean) {
    if (this.emptyDiv === undefined) {
      const div = document.createElement("div");
      div.className = "pane-empty";
      div.innerText = "No content found";
      removeExistingSVG();
      this.containerEl.children[1].appendChild(div);
      this.emptyDiv = div;
    }
    this.emptyDiv.toggle(display);
  }
}
