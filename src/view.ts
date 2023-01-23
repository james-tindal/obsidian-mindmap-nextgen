import { ItemView, Menu, TFile, Workspace, WorkspaceLeaf, debounce, MarkdownView, Editor, stringifyYaml } from "obsidian";
import { Transformer, builtInPlugins } from "markmap-lib";
import { Markmap, loadCSS, loadJS, deriveOptions } from "markmap-view";
import { INode, IMarkmapOptions } from "markmap-common";
import { Toolbar } from "markmap-toolbar";
console.log('livddde')
import { MM_VIEW_TYPE } from "./constants";
import Linker from "./linker";
import { createSVG, getComputedCss } from "./markmap-svg";
import { takeScreenshot } from "./copy-image";
import { htmlEscapePlugin, checkBoxPlugin } from "./plugins";
import { PluginSettings } from "./filesystem-data";
import { assocPath, dissocPath, path, pipe } from "ramda";
import { SettingsTab } from "./settings-tab";

export default class View extends ItemView {
  private linkedLeaf: WorkspaceLeaf;
  private displayText: string;
  private workspace: Workspace;
  private svg: SVGElement;
  private linker: Linker;
  private settings: PluginSettings;
  private markmapSVG: Markmap;
  private options: Partial<IMarkmapOptions>;
  private frontmatterOptions: FrontmatterOptions;
  private hasFit: boolean;
  private toolbar: HTMLElement;
  private pinned: boolean = false;
  private static instances: View[] = [];
  
  public file: TFile;

  constructor(settings: PluginSettings, leaf: WorkspaceLeaf) {
    super(leaf);
    View.instances.push(this);
    this.settings = settings;
    this.linker = new Linker();

    this.svg = createSVG(this.containerEl, this.settings.lineHeight);

    this.hasFit = false;

    this.createMarkmapSvg();

    this.createToolbar();

    this.registerListeners();
    
    this.file = app.workspace.getActiveFile();
    app.workspace.onLayoutReady(() => this.render());

    leaf.on("pinned-change", (pinned) => this.pinned = pinned)

    SettingsTab.events.listen("setting-changed:titleAsRootNode", () => this.render());
  }

  public async onClose() {
    const index = View.instances.findIndex(instance => instance === this);
    delete View.instances[index];
  }

  private modifyFile(data: string) {
    app.vault.modify(this.file, data)
  }

  getViewType(): string {
    return MM_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.displayText ?? "Mind Map";
  }

  getIcon() {
    return "dot-network";
  }

  private onMoreOptionsMenu(menu: Menu) {
    menu
      .addItem((item) => item
        .setIcon("pin")
        .setTitle(this.pinned ? "Unpin" : "Pin")
        .onClick(() => this.pinned ? this.unPin() : this.pinCurrentLeaf())
      )
      .addItem((item) => item
        .setIcon("image-file")
        .setTitle("Copy screenshot")
        .onClick(() =>
          takeScreenshot(
            this.settings,
            this.markmapSVG,
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

  private createMarkmapSvg() {
    this.markmapSVG = Markmap.create(this.svg, {});
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

    const el = Toolbar.create(this.markmapSVG) as HTMLElement;

    container.append(el);
    this.containerEl.append(container);

    this.toolbar = container;
  }

  private registerListeners() {
    const editorChange: (
      editor: Editor,
      markdownView: MarkdownView
    ) => any = (editor) => {
      const content = editor.getValue();
      const pinned = this.leaf.getViewState().pinned
      if (! pinned) this.render(content);
    };

    const debouncedEditorChange = debounce(editorChange, 300, true);
    const listeners = [
      app.workspace.on("editor-change", debouncedEditorChange),
      app.workspace.on("file-open", (file) => {
        this.file = file;
        const pinned = this.leaf.getViewState().pinned
        if (! pinned) this.render();
      }),
      this.leaf.on("pinned-change", (pinned) => {
        if (! pinned) this.render();
      }),
    ];

    listeners.forEach(listener => this.registerEvent(listener))
  }

  private updateLinkedLeaf(group: string, mmView: View) {
    if (group === null) {
      mmView.linkedLeaf = undefined;
      return;
    }
    const mdLinkedLeaf = mmView.workspace
      .getGroupLeaves(group)
      .filter((l) => l?.view?.getViewType() === MM_VIEW_TYPE)[0];
    mmView.linkedLeaf = mdLinkedLeaf;

    this.render();
  }

  private pinCurrentLeaf() {
    this.leaf.setPinned(true);
  }

  private unPin() {
    this.leaf.setPinned(false);
  }

  private collapseAll() {
    this.markmapSVG.setData(this.markmapSVG.state.data, {
      ...this.options,
      initialExpandLevel: 0,
    });
  }

  private async render(content?: string) {
    try {
      const markdown =
        typeof content === "string" ? content : await app.vault.cachedRead(this.file);

      if (!markdown) return;

      const sanitisedMarkdown = this.sanitiseMarkdown(markdown);
      
      const transformer = new Transformer([ ...builtInPlugins, htmlEscapePlugin, checkBoxPlugin, ]);

      let { root: root_, features, frontmatter } = transformer.transform(sanitisedMarkdown);

      const { scripts, styles } = transformer.getUsedAssets(features);

      this.upgradeFrontmatter(frontmatter, markdown);

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

      const root = titleAsRootNode ? this.titleAsRootNode(root_) : root_;
      this.linker.updateInternalLinks(root);

      if (styles) loadCSS(styles);
      if (scripts) loadJS(scripts);

      const settings = this.settings;

      this.displayText = this.file.basename || "Mind map";

      setTimeout(() => this.applyWidths(), 100);
      
      const { font, color: computedColor } = getComputedCss(this.containerEl);

      if (computedColor) {
        this.svg.setAttr(
          "style",
          `--mm-line-height: ${settings.lineHeight ?? "1em"};`
        );
      }

      const options: Partial<IMarkmapOptions> = {
        autoFit: false,
        style: (id) => `${id} * {font: ${font}}`,
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

      this.markmapSVG.setData(root, {
        ...options,
        ...markmapOptions,
      });

      if (!this.hasFit) {
        this.markmapSVG.fit();
        this.hasFit = true;
      }
    }
    catch(e) {
      console.error("Render error", e)
    }
  }

  private waitForSave() {
    return new Promise((resolve) => {
      const listener = app.vault.on('modify', file => {
        resolve(file);
        app.vault.offref(listener)
      })
    });
  }

  // Upgrade deprecated frontmatter keys to new ones.
  private async upgradeFrontmatter(frontmatter: Object, markdown: string) {
    await this.waitForSave()

    const screenshotFgColor = path(['markmap', 'screenshotFgColor'], frontmatter);
    if (!screenshotFgColor) return;

    const upgrade = pipe(
      dissocPath(['markmap', 'screenshotFgColor']),
      assocPath(['markmap', 'screenshotTextColor'], screenshotFgColor),
      stringifyYaml
    );

    const newFrontmatter = upgrade(frontmatter);
    const markdownWithoutFrontmatter = markdown.match(/^---$(((?!^---$).)*)/mgs)[1]

    const newFile = '---\n' + newFrontmatter + markdownWithoutFrontmatter

    this.modifyFile(newFile)
  }

  private sanitiseMarkdown(markdown: string) {
    // Remove info string from code fence unless it is "js" or "javascript"
    // transformer.transform can't handle other languages
    const allowedLanguages = ["js", "javascript", "css", "html"]
    return markdown.replace(/```(.+)/, (_, capture) => {
      const backticks = capture.match(/(`*).*/)?.[1]
      const infoString = capture.match(/`*(.*)/)?.[1]
      const t = infoString?.trim()
      const sanitisedInfoString = allowedLanguages.includes(t) ? t : ""
      return "```" + (backticks || "") + sanitisedInfoString
    })
  }

  private titleAsRootNode(root: INode) {
    if (root.content == "") return { ...root, content: this.file.basename }
    return { content: this.file.basename, children: [root], type: 'heading', depth: 0 }
  }

  private depthColoring(frontmatterColors?: string[]) {
    return ({ depth }: INode) => {
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
        const colorIndex = Math.min(3, parseInt(el.dataset.depth));

        el.style.strokeWidth = `${colors[colorIndex]}`;
      });

    this.svg.querySelectorAll("g.markmap-node").forEach((el: SVGGElement) => {
      const line = el.querySelector("line");

      const colorIndex = Math.min(3, parseInt(el.dataset.depth));
      line.style.strokeWidth = `${colors[colorIndex]}`;
    });

    this.svg.querySelectorAll("circle").forEach((el) => {
      this.registerDomEvent(el as unknown as HTMLElement, "click", () =>
        setTimeout(() => this.applyWidths(), 50)
      );
    });
  }
}
