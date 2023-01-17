import { Plugin as ObsidianPlugin, Vault, Workspace, WorkspaceLeaf } from "obsidian";

import View from "./mindmap-view";
import { MM_VIEW_TYPE } from "./constants";
import { SettingsTab } from "./settings-tab";
import { inlineRenderer } from "./inline-renderer";

import { DEFAULT_SETTINGS, MindMapSettings } from "./@types/settings";

export default class Plugin extends ObsidianPlugin {
  vault: Vault;
  workspace: Workspace;
  settings: MindMapSettings;

  async onload() {
    console.log("Loading Mind Map plugin");
    this.vault = this.app.vault;
    this.workspace = this.app.workspace;
    this.settings = { ...DEFAULT_SETTINGS, ...await this.loadData() };

    this.registerView(
      MM_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new View(this.settings, leaf)
    );

    this.addCommand({
      id: "app:markmap-preview",
      name: "Preview the current note as a Mind Map",
      callback: () => {
        this.markMapPreview();
      },
      hotkeys: [],
    });

    this.addSettingTab(new SettingsTab(this.app, this));

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
    const mmPreview = new View(this.settings, preview);

    preview.open(mmPreview);
  }

  async onunload() {
    console.log("Unloading Mind Map plugin");
  }

  activeLeafName(workspace: Workspace) {
    return workspace.activeLeaf?.getDisplayText();
  }
}
