import { ItemView, Menu, TFile, WorkspaceLeaf, stringifyYaml } from "obsidian";
import { Transformer, builtInPlugins } from "markmap-lib";
import { Markmap, deriveOptions } from "markmap-view";
import { INode, IMarkmapOptions } from "markmap-common";
import { Toolbar } from "markmap-toolbar";

import { MM_VIEW_TYPE } from "src/constants";
import { createSVG } from "src/markmap-svg";
import { takeScreenshot } from "src/screenshot";
import { htmlEscapePlugin, checkBoxPlugin } from "src/plugins";
import { PluginSettings } from "src/filesystem";
import { updateInternalLinks } from "src/linker"
import { CustomFrontmatter, FrontmatterOptions } from "src/types/models"


export default class View extends ItemView {
  private svg: SVGElement;
  private settings: PluginSettings;
  private markmap: Markmap;
  private options: Partial<IMarkmapOptions>;
  private frontmatterOptions: FrontmatterOptions;
  private toolbar?: HTMLElement;
  private hasRendered: boolean = false;
  private displayText: string;
  private pinned: boolean;
  
  public isView = true;

  constructor(settings: PluginSettings, leaf: WorkspaceLeaf, displayText: string, pinned: boolean) {
    super(leaf);
    this.settings = settings;
    this.displayText = displayText;

    const { svg, markmap } = createSVG(this.containerEl);
    this.svg = svg;
    this.markmap = markmap;
    this.createToolbar();

    this.pinned = pinned;
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
    menu
      .addItem((item) => item
        .setIcon("pin")
        .setTitle(this.pinned ? "Unpin" : "Pin")
        .onClick(() => this.togglePinned())
      )
      .addItem((item) => item
        .setIcon("image-file")
        .setTitle("Copy screenshot")
        .onClick(() =>
          takeScreenshot(
            this.settings,
            this.markmap,
            this.frontmatterOptions
      )))
      .addItem((item) => item
        .setIcon("folder")
        .setTitle("Collapse All")
        .onClick(() => this.collapseAll())
      )
      .addItem((item) => item
        .setIcon("view")
        .setTitle("Toogle toolbar")
        .onClick(() => this.toggleToolbar())
      );

    menu.showAtPosition({ x: 0, y: 0 });
  }

  private toggleToolbar() {
    if (this.toolbar) {
      this.toolbar.remove();
      this.toolbar = undefined;
    } else {
      this.createToolbar();
    }
  }

  private createToolbar() {
    const container = document.createElement("div");
    container.className = "markmap-toolbar-container";

    const el = Toolbar.create(this.markmap) as HTMLElement;

    container.append(el);
    this.containerEl.append(container);

    this.toolbar = container;
  }

  private collapseAll() {
    this.markmap.setData(this.markmap.state.data, {
      ...this.options,
      initialExpandLevel: 0,
    });
  }

  public async firstRender(file: TFile) {
    if (this.hasRendered) return;
    this.hasRendered = true;
    await this.render(file);
    this.markmap.fit();
  }

  public async render(file: TFile, content?: string) {
    if (!this.hasRendered) return;

    const markdown = content ? content : await app.vault.cachedRead(file);

    if (!markdown) return;

    const sanitisedMarkdown = this.sanitiseMarkdown(markdown);
    
    const transformer = new Transformer([ ...builtInPlugins, htmlEscapePlugin, checkBoxPlugin, ]);

    let { root: root_, frontmatter } = transformer.transform(sanitisedMarkdown);

    const actualFrontmatter = frontmatter as CustomFrontmatter;

    const markmapOptions = deriveOptions(frontmatter?.markmap);

    const frontmatterOptions = this.frontmatterOptions = {
      ...markmapOptions,
      screenshotTextColor: actualFrontmatter?.markmap?.screenshotTextColor,
      screenshotBgColor: actualFrontmatter?.markmap?.screenshotBgColor,
      titleAsRootNode: actualFrontmatter?.markmap?.titleAsRootNode
    };

    const titleAsRootNode =
      typeof frontmatterOptions.titleAsRootNode === 'boolean'
      ? frontmatterOptions.titleAsRootNode
      : this.settings.titleAsRootNode;

    const root = titleAsRootNode ? this.titleAsRootNode(root_, file.basename) : root_;
    updateInternalLinks(root);

    const settings = this.settings;

    setTimeout(() => this.applyWidths(), 100);
    
    const computedColor = getComputedStyle(this.containerEl).getPropertyValue("--text-normal");

    if (computedColor) {
      this.svg.setAttr(
        "style",
        `--mm-line-height: ${settings.lineHeight ?? "1em"};`
      );
    }

    const options: Partial<IMarkmapOptions> = {
      autoFit: false,
      nodeMinHeight: settings.nodeMinHeight ?? 16,
      spacingVertical: settings.spacingVertical ?? 5,
      spacingHorizontal: settings.spacingHorizontal ?? 80,
      paddingX: settings.paddingX ?? 8,
      embedGlobalCSS: true,
      fitRatio: 1,
      initialExpandLevel: settings.initialExpandLevel ?? -1,
      maxWidth: settings.maxWidth ?? 0,
      duration: settings.animationDuration ?? 500,
    };

    const coloring = settings.coloring

    if (coloring === "depth")
      options.color =
        this.depthColoring(frontmatter?.markmap?.color);
    if (coloring === "single")
      options.color =
        () => settings.defaultColor;

    this.options = options;

    this.markmap.setData(root, {
      ...options,
      ...markmapOptions,
    });
  }

  private waitForSave() {
    return new Promise((resolve) => {
      const listener = app.vault.on('modify', file => {
        resolve(file);
        app.vault.offref(listener)
      })
    });
  }

  private sanitiseMarkdown(markdown: string) {
    // Remove info string from code fence unless it in the list of default languages from
    // https://prismjs.com/#supported-languages
    const allowedLanguages = ["markup", "html", "xml", "svg", "mathml", "ssml", "atom", "rss", "js", "javascript", "css", "clike"]
    return markdown.replace(/```(.+)/g, (_, capture) => {
      const backticks = capture.match(/(`*).*/)?.[1]
      const infoString = capture.match(/`*(.*)/)?.[1]
      const t = infoString?.trim()
      const sanitisedInfoString = allowedLanguages.includes(t) ? t : ""
      return "```" + (backticks || "") + sanitisedInfoString
    })
  }

  private titleAsRootNode(root: INode, title: string) {
    if (root.content == "") return { ...root, content: title }
    return { content: title, children: [root], type: 'heading', depth: 0 }
  }

  private depthColoring(frontmatterColors?: string[]) {
    return ({ depth }: INode) => {
      depth = depth!;
      if (frontmatterColors?.length)
        return frontmatterColors[depth % frontmatterColors.length]

      const colors = [this.settings.depth1Color, this.settings.depth2Color, this.settings.depth3Color];

      return depth < 3 ?
        colors[depth] :
        this.settings.defaultColor
    };
  }

  private applyWidths() {
    if (!this.svg) return;

    const colors = [
      this.settings.depth1Thickness,
      this.settings.depth2Thickness,
      this.settings.depth3Thickness,
      this.settings.defaultThickness,
    ];

    this.svg
      .querySelectorAll("path.markmap-link")
      .forEach((el: SVGPathElement) => {
        const colorIndex = Math.min(3, parseInt(el.dataset.depth!));

        el.style.strokeWidth = `${colors[colorIndex]}`;
      });

    this.svg.querySelectorAll("g.markmap-node").forEach((el: SVGGElement) => {
      const line = el.querySelector("line")!;

      const colorIndex = Math.min(3, parseInt(el.dataset.depth!));
      line!.style.strokeWidth = `${colors[colorIndex]}`;
    });

    this.svg.querySelectorAll("circle").forEach((el) => {
      this.registerDomEvent(el as unknown as HTMLElement, "click", () =>
        setTimeout(() => this.applyWidths(), 50)
      );
    });
  }
}
