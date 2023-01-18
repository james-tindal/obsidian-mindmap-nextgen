import { Plugin as ObsidianPlugin, Vault, Workspace, WorkspaceLeaf } from "obsidian";

import View from "./mindmap-view";
import { MM_VIEW_TYPE } from "./constants";
import { SettingsTab } from "./settings-tab";
import { inlineRenderer, pickInlineRendererSettings } from "./inline-renderer";

import { FileSystemManager, PluginSettings } from "./filesystem-data";

export default class Plugin extends ObsidianPlugin {
  vault: Vault;
  workspace: Workspace;

  async onload() {
    console.log("Loading Mind Map plugin");
    this.vault = this.app.vault;
    this.workspace = this.app.workspace;

    const [settings] = await FileSystemManager(this.loadData.bind(this), this.saveData.bind(this));

    this.registerView(
      MM_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new View(settings.getAll(), leaf)
    );

    this.addCommand({
      id: "app:markmap-preview",
      name: "Preview the current note as a Mind Map",
      callback: () => this.initPreview(settings.getAll()),
      hotkeys: [],
    });

    this.addSettingTab(new SettingsTab(this.app, this, settings));

    const rendererSettings = settings.pick(...pickInlineRendererSettings)
    this.registerMarkdownCodeBlockProcessor(
      "markmap",
      inlineRenderer(rendererSettings)
    );
  }

  async initPreview(settings: PluginSettings) {
    if (this.app.workspace.getLeavesOfType(MM_VIEW_TYPE).length > 0) {
      return;
    }
    const preview = this.app.workspace.getLeaf(
      "split",
      settings.splitDirection
    );
    const mmPreview = new View(settings, preview);

    preview.open(mmPreview);
  }

  async onunload() {
    console.log("Unloading Mind Map plugin");
  }

  activeLeafName(workspace: Workspace) {
    return workspace.activeLeaf?.getDisplayText();
  }
}
