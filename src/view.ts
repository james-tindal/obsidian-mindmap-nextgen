import { EventRef, ItemView, Menu, TFile, Workspace, WorkspaceLeaf, debounce, MarkdownView, Editor, stringifyYaml, Vault } from "obsidian";
import { Transformer, builtInPlugins } from "markmap-lib";
import { Markmap, loadCSS, loadJS, deriveOptions } from "markmap-view";
import { INode, IMarkmapOptions, IMarkmapJSONOptions } from "markmap-common";
import { Toolbar } from "markmap-toolbar";
import { ZoomTransform } from "d3-zoom";

import { MM_VIEW_TYPE } from "./constants";
import Linker from "./linker";
import { createSVG, getComputedCss } from "./markmap-svg";
import { takeScreenshot } from "./copy-image";
import { htmlEscapePlugin, checkBoxPlugin } from "./plugins";
import { PluginSettings } from "./filesystem-data";
import { assocPath, dissocPath, path, pipe } from "ramda";

export default class View extends ItemView {
  private linkedLeaf: WorkspaceLeaf;
  private displayText: string;
  private workspace: Workspace;
  private listeners: EventRef[];
  private emptyDiv: HTMLDivElement;
  private svg: SVGElement;
  private linker: Linker;
  private settings: PluginSettings;
  private currentTransform: ZoomTransform;
  private markmapSVG: Markmap;
  private transformer: Transformer;
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

    this.transformer = new Transformer([
      ...builtInPlugins,
      htmlEscapePlugin,
      checkBoxPlugin,
    ]);
    this.svg = createSVG(this.containerEl, this.settings.lineHeight);

    this.hasFit = false;

    this.createMarkmapSvg();

    this.createToolbar();

    this.registerListeners();
    
    this.file = app.workspace.getActiveFile();
    app.workspace.onLayoutReady(async () => await this.update());

    leaf.on("pinned-change", (pinned) => this.pinned = pinned)
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
      if (! pinned) this.update(content);
    };

    const debouncedEditorChange = debounce(editorChange, 300, true);
    const listeners = [
      app.workspace.on("editor-change", debouncedEditorChange),
      app.workspace.on("file-open", (file) => {
        this.file = file;
        const pinned = this.leaf.getViewState().pinned
        if (! pinned) this.update();
      }),
      this.leaf.on("pinned-change", (pinned) => {
        if (! pinned) this.update();
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

    this.update();
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

  private async update(content?: string) {
    try {
      const markdown =
        typeof content === "string" ? content : await this.readMarkDown();

      if (!markdown) return;

      let { root, scripts, styles, frontmatter } = await this.transformMarkdown(
        markdown
      );

      this.upgradeFrontmatter(frontmatter, markdown);

      const actualFrontmatter = frontmatter as CustomFrontmatter;

      const markmapOptions = deriveOptions(frontmatter?.markmap);

      this.frontmatterOptions = {
        ...markmapOptions,
        screenshotTextColor: actualFrontmatter?.markmap?.screenshotTextColor,
        screenshotBgColor: actualFrontmatter?.markmap?.screenshotBgColor,
      };

      if (styles) loadCSS(styles);
      if (scripts) loadJS(scripts);

      this.renderMarkmap(root, markmapOptions, frontmatter?.markmap ?? {}, this.settings);

      this.displayText = this.file.basename || "Mind map";

      setTimeout(() => this.applyWidths(), 100);
    } catch (error) {
      console.log("Error on update: ", error);
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

  private async readMarkDown() {
    try {
      return await app.vault.cachedRead(this.file);
    } catch (error) {
      console.log(error);
    }
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

  private async transformMarkdown(markdown: string) {
    const sanitisedMarkdown = this.sanitiseMarkdown(markdown)
    let { root, features, frontmatter } = this.transformer.transform(sanitisedMarkdown);

    const { scripts, styles } = this.transformer.getUsedAssets(features);

    this.linker.updateInternalLinks(root);
    return { root, scripts, styles, frontmatter };
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

  private renderMarkmap(
    root: INode,
    frontmatterOptions: Partial<IMarkmapOptions>,
    frontmatter: Partial<IMarkmapJSONOptions> = {},
    settings: PluginSettings
  ) {
    try {
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
          this.depthColoring(frontmatter?.color);
      if (coloring === "single")
        options.color =
          () => settings.defaultColor;

      this.options = options;

      this.markmapSVG.setData(root, {
        ...options,
        ...frontmatterOptions,
      });

      if (!this.hasFit) {
        this.markmapSVG.fit();
        this.hasFit = true;
      }

    } catch (error) {
      console.error(error);
    }
  }
}
