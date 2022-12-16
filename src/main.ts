import { Plugin, Vault, Workspace, WorkspaceLeaf } from "obsidian";
import MindmapView from "./mindmap-view";
import { MM_VIEW_TYPE } from "./constants";
import { MindMapSettings } from "./settings";
import { MindMapSettingsTab } from "./settings-tab";
import { updater } from "./updater";
import { inlineRenderer } from "./inline-renderer";

export default class MindMap extends Plugin {
  vault: Vault;
  workspace: Workspace;
  mindmapView: MindmapView;
  settings: MindMapSettings;

  async onload() {
    console.log("Loading Mind Map plugin");
    this.vault = this.app.vault;
    this.workspace = this.app.workspace;
    this.settings = Object.assign(
      {
        splitDirection: "horizontal",
        nodeMinHeight: 16,
        lineHeight: "1em",
        spacingVertical: 5,
        spacingHorizontal: 80,
        paddingX: 8,
        initialExpandLevel: -1,

        color1: "#fed766",
        color1Thickness: "10",

        color2: "#2ab7ca",
        color2Thickness: "6",

        color3: "#fe4a49",
        color3Thickness: "4",

        defaultColor: "#000000",
        defaultColorThickness: "2",

        onlyUseDefaultColor: false,

        coloring: "depth",
        colorFreezeLevel: 0,
        animationDuration: 500,
        maxWidth: 0,
        screenshotBgColor: "#039614",
        screenshotTransparentBg: true,
        highlight: true,
      },
      await this.loadData()
    );

    this.registerView(MM_VIEW_TYPE, (leaf: WorkspaceLeaf) => {
      this.mindmapView = new MindmapView(this.settings, leaf, {
        path: this.activeLeafPath(this.workspace),
        basename: this.activeLeafName(this.workspace),
      });

      return this.mindmapView;
    });

    this.addCommand({
      id: "app:markmap-preview",
      name: "Preview the current note as a Mind Map",
      callback: () => {
        this.markMapPreview();
      },
      hotkeys: [],
    });

    this.addSettingTab(new MindMapSettingsTab(this.app, this));

    this.registerEditorExtension(updater(this.mindmapView));
    this.registerMarkdownCodeBlockProcessor(
      "markmap",
      inlineRenderer(this.settings)
    );
  }

  markMapPreview() {
    const fileInfo = {
      path: this.activeLeafPath(this.workspace),
      basename: this.activeLeafName(this.workspace),
    };
    this.initPreview(fileInfo);
  }

  async initPreview(fileInfo: { path: string; basename: string }) {
    if (this.app.workspace.getLeavesOfType(MM_VIEW_TYPE).length > 0) {
      return;
    }
    const preview = this.app.workspace.getLeaf(
      "split",
      this.settings.splitDirection
    );
    const mmPreview = new MindmapView(this.settings, preview, fileInfo);

    preview.open(mmPreview);
  }

  async onunload() {
    console.log("Unloading Mind Map plugin");
  }

  activeLeafPath(workspace: Workspace) {
    return workspace.activeLeaf?.view.getState().file;
  }

  activeLeafName(workspace: Workspace) {
    return workspace.activeLeaf?.getDisplayText();
  }
}
