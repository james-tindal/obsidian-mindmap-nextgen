import { Plugin as ObsidianPlugin, Vault, Workspace, WorkspaceLeaf } from "obsidian";

import View from "./view";
import { MM_VIEW_TYPE } from "./constants";
import { SettingsTab } from "./settings-tab";
import { inlineRenderer, pickInlineRendererSettings } from "./inline-renderer";

import { FileSystemManager, PluginSettings } from "./filesystem-data";

export default class Plugin extends ObsidianPlugin {

  async onload() {
    console.log("Loading Mind Map plugin");

    const loadData = this.loadData.bind(this);
    const saveData = this.saveData.bind(this);

    const [settings] = await FileSystemManager(loadData, saveData);

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

    this.addSettingTab(new SettingsTab(this, settings));

    const rendererSettings = settings.pick(...pickInlineRendererSettings)
    this.registerMarkdownCodeBlockProcessor(
      "markmap",
      inlineRenderer(rendererSettings)
    );
  }

  async initPreview(settings: PluginSettings) {
    if (app.workspace.getLeavesOfType(MM_VIEW_TYPE).length > 0) {
      return;
    }
    app.workspace
      .getLeaf("split", settings.splitDirection)
      .setViewState({
        type: MM_VIEW_TYPE,
        active: true
      });
  }

  async onunload() {
    console.log("Unloading Mind Map plugin");
  }

  activeLeafName(workspace: Workspace) {
    return workspace.activeLeaf?.getDisplayText();
  }
}
