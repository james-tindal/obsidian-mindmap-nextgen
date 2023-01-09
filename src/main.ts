import { Plugin, Vault, Workspace, WorkspaceLeaf } from "obsidian";

import MindmapView from "./mindmap-view";
import { MM_VIEW_TYPE } from "./constants";
import { MindMapSettingsTab } from "./settings-tab";
import { inlineRenderer } from "./inline-renderer";

import { ScreenshotBgStyle } from "./@types/screenshot";

const DEFAULT_SETTINGS = {
  splitDirection: "horizontal",
  nodeMinHeight: 16,
  lineHeight: "1em",
  spacingVertical: 5,
  spacingHorizontal: 80,
  paddingX: 8,
  color1: "#cb4b16",
  color1Thickness: "3",

  color2: "#6c71c4",
  color2Thickness: "1.5",

  color3: "#859900",
  color3Thickness: "1",

  defaultColor: "#b58900",
  defaultColorThickness: "1",

  initialExpandLevel: -1,

  onlyUseDefaultColor: false,

  coloring: "depth",

  colorFreezeLevel: 0,
  animationDuration: 500,
  maxWidth: 0,
  // below a beautiful dark blue color
  screenshotBgColor: "#002b36",
  screenshotFgColor: "#fdf6e3",
  screenshotFgColorEnabled: false,
  screenshotBgStyle: ScreenshotBgStyle.Transparent,
  screenshotTransparentBg: true,
  highlight: true,
};

export default class MindMap extends Plugin {
  vault: Vault;
  workspace: Workspace;
  settings: MindMapSettings;

  async onload() {
    console.log("Loading Mind Map plugin");
    this.vault = this.app.vault;
    this.workspace = this.app.workspace;
    this.settings = Object.assign(
      { ...DEFAULT_SETTINGS },
      await this.loadData()
    );

    this.registerView(
      MM_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new MindmapView(this.settings, leaf)
    );

    this.addCommand({
      id: "app:markmap-preview",
      name: "Preview the current note as a Mind Map",
      callback: () => {
        this.markMapPreview();
      },
      hotkeys: [],
    });

    this.addSettingTab(new MindMapSettingsTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor(
      "markmap",
      inlineRenderer(this.settings)
    );
  }

  markMapPreview() {
    this.initPreview();
  }

  async initPreview() {
    if (this.app.workspace.getLeavesOfType(MM_VIEW_TYPE).length > 0) {
      return;
    }
    const preview = this.app.workspace.getLeaf(
      "split",
      this.settings.splitDirection
    );
    const mmPreview = new MindmapView(this.settings, preview);

    preview.open(mmPreview);
  }

  async onunload() {
    console.log("Unloading Mind Map plugin");
  }

  activeLeafName(workspace: Workspace) {
    return workspace.activeLeaf?.getDisplayText();
  }
}
