import {
  EventRef,
  ItemView,
  Menu,
  Vault,
  Workspace,
  WorkspaceLeaf,
} from "obsidian";
import { Transformer, builtInPlugins } from "markmap-lib";
import { Markmap, loadCSS, loadJS } from "markmap-view";
import { INode, IMarkmapOptions, JSItem, CSSItem } from "markmap-common";
import { FRONT_MATTER_REGEX, MD_VIEW_TYPE, MM_VIEW_TYPE } from "./constants";
import ObsidianMarkmap from "./obsidian-markmap-plugin";
import { createSVG, getComputedCss, removeExistingSVG } from "./markmap-svg";
import { copyImageToClipboard } from "./copy-image";
import { MindMapSettings } from "./settings";
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
  transformer: Transformer;

  groupEventListenerFn: () => unknown;

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
      )
      .addSeparator()
      .addItem((item) =>
        item
          .setIcon("folder")
          .setTitle("Collapse All")
          .onClick(() => {
            try {
              this.markmapSVG.g
                .selectAll("g")
                .nodes()
                .forEach((node: HTMLElement) => {
                  if (
                    node.querySelector("circle")?.getAttribute("fill") ==
                    "rgb(255, 255, 255)"
                  ) {
                    node.dispatchEvent(new CustomEvent("click"));
                  }
                });
            } catch (err) {
              console.log(err);
            }
          })
      );

    menu.showAtPosition({ x: 0, y: 0 });
  }

  constructor(
    settings: MindMapSettings,
    leaf: WorkspaceLeaf,
    initialFileInfo: { path: string; basename: string }
  ) {
    super(leaf);
    this.settings = settings;
    this.filePath = initialFileInfo.path;
    this.fileName = initialFileInfo.basename;
    this.vault = this.app.vault;
    this.workspace = this.app.workspace;
    this.transformer = new Transformer(builtInPlugins);
  }

  async onOpen() {
    this.obsMarkmap = new ObsidianMarkmap(this.vault);
    this.registerActiveLeafUpdate();
    this.workspace.onLayoutReady(() => this.update());
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
    let root: INode;
    if (this.filePath) {
      await this.readMarkDown();
      if (
        this.currentMd.length === 0 ||
        this.getLeafTarget().view.getViewType() != MD_VIEW_TYPE
      ) {
        this.displayEmpty(true);
        removeExistingSVG();
      } else {
        let { scripts, styles, ...transformedMarkdown } =
          await this.transformMarkdown();
        root = transformedMarkdown.root;

        this.displayEmpty(false);

        if (this.svg)
          this.svg
            .querySelectorAll("g")
            .forEach((elem) =>
              elem.removeEventListener("click", this.groupEventListenerFn)
            );
        this.svg = createSVG(this.containerEl, this.settings.lineHeight);

        this.renderMarkmap(root, this.svg, scripts, styles);
      }
    }
    this.displayText =
      this.fileName != undefined ? `Mind Map of ${this.fileName}` : "Mind Map";
    this.load();

    // setTimeout(() => this.applyWidths(root), 100);
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
    let { root, features } = this.transformer.transform(this.currentMd);

    const { scripts, styles } = this.transformer.getUsedAssets(features);

    this.obsMarkmap.updateInternalLinks(root);
    return { root, features, scripts, styles };
  }

  applyColor({ depth }: INode) {
    const colors = [
      this.settings.color1,
      this.settings.color2,
      this.settings.color3,
    ];

    return depth < colors.length ? colors[depth] : this.settings.defaultColor;
  }

  hexToRgb(hex: string) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    const red = parseInt(result[1], 16);
    const green = parseInt(result[2], 16);
    const blue = parseInt(result[3], 16);

    return result ? `rgb(${red}, ${green}, ${blue})` : null;
  }

  applyWidths(root: INode) {
    const colors = [
      [this.hexToRgb(this.settings.color1), this.settings.color1Thickness],
      [this.hexToRgb(this.settings.color2), this.settings.color2Thickness],
      [this.hexToRgb(this.settings.color3), this.settings.color3Thickness],
      [
        this.hexToRgb(this.settings.defaultColor),
        this.settings.defaultColorThickness,
      ],
    ] as const;

    Array.from(this.svg.querySelectorAll("*")).forEach((el) => {
      if (el.tagName == "circle") return;

      colors.forEach(([color, thickness]) => {
        if (el.getAttribute("stroke") === color) {
          el.setAttribute("stroke-width", `${thickness}`);
        } else if (el.getAttribute("fill") === color) {
          el.setAttribute("height", `${thickness}`);
        }
      });
    });

    return;

    // the solution above only applies thickness to the the same color (colos and ok,
    // they are passed via argument, so it's completely safe). The problem is in case someone
    // selects the same color for all four colors (color1, 2, 3 and default). In this case, for all
    // colors, the same thickness will be applied.

    // below an beta solution that should be tested and improved later.

    // This beta solution relies on the fact that the rects can be obtained via an INode, which
    // is a hierarchical structure. The problem about the rect (the rectangle below the text),
    // is that I take the element using the content (the text within it), but there may be repeating content.
    // For the lines (path elements) I take advantage of the fact that they all come from a single node.
    // But the current below solution only take that in account, not the fact that they must branch-siblings
    // which means the node that this path is connected from is also connected to another path that comes
    // from another node and all paths that come from this node are siblings, and so on. So it doesn't mean siblings
    // come from the same node, but instead comes from the same "family", and so on. Which need further
    // investigation, as Markmap itself doesn't suit this kind of personalisation (I've checked the source code,
    // and those strokes are hard coded).

    // possible workarounds for the rect problem:
    // store the element position and compares on every ocurrence, if the new ocurrence comes before or after
    // (in coordinates), the levels of the already found ocurrences should be reorganized.
  }

  applyWidthsOld(root: INode) {
    const widths = ["20", "10", "5", "5"];

    const queue = [root];

    while (queue.length) {
      const node = queue.shift();

      queue.push(...node.children);

      const text = node.state.el.innerHTML;

      if (text) {
        const nodesWithContent = Array.from(
          this.svg.querySelectorAll("*")
        ).filter((el) => el.innerHTML == text)[0];

        const width = Math.min(4, node.depth);

        nodesWithContent.parentElement.parentElement
          .querySelector("rect")
          .setAttribute("height", widths[width - 1]);
      }
    }

    const getD = (pathEl: SVGPathElement) => pathEl.getAttribute("d");
    const getM = (dAttribute: string) =>
      parseInt(dAttribute.split(",")[0].substring(1));

    const sortedPaths = Array.from(this.svg.querySelectorAll("path")).sort(
      (a, b) => getM(getD(a)) - getM(getD(b))
    );

    console.log(sortedPaths);

    let currentMValue: number;
    let currentIndex = 0;
    for (let path of sortedPaths) {
      if (Math.abs(getD(path).length - 33) > 5) continue;
      console.log(getM(getD(path)));

      if (currentMValue === undefined) {
        currentMValue = getM(getD(path));
      }

      if (getM(getD(path)) !== currentMValue) {
        currentIndex = Math.min(3, currentIndex + 1);
        currentMValue = getM(getD(path));
      }

      path.style.strokeWidth = widths[currentIndex];
    }

    this.svg.querySelectorAll("g").forEach((el) => {
      this.groupEventListenerFn = () => this.applyWidths(root);
      el.addEventListener("click", this.groupEventListenerFn);
    });

    return root;
  }

  async renderMarkmap(
    root: INode,
    svg: SVGElement,
    scripts: JSItem[],
    styles: CSSItem[]
  ) {
    const { font } = getComputedCss(this.containerEl);
    const options: Partial<IMarkmapOptions> = {
      autoFit: false,
      color: this.applyColor.bind(this),
      duration: 10,
      style: (id) => `${id} * {font: ${font}}`,
      nodeMinHeight: this.settings.nodeMinHeight ?? 16,
      spacingVertical: this.settings.spacingVertical ?? 5,
      spacingHorizontal: this.settings.spacingHorizontal ?? 80,
      paddingX: this.settings.paddingX ?? 8,
      embedGlobalCSS: true,
      fitRatio: 1,
    };
    try {
      let hasAppliedZoom = false;
      const previousTransform = this.currentTransform;

      if (styles) loadCSS(styles);
      if (scripts) loadJS(scripts);

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
