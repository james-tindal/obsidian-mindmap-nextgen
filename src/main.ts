import { App, Plugin as ObsidianPlugin, PluginManifest, Workspace, WorkspaceLeaf } from "obsidian";

import View from "./views/view";
import { MM_VIEW_TYPE } from "./constants";
import { inlineRenderer } from "./inline-renderer";

import { manageFilesystemData, PluginSettings, settingChanges } from "./filesystem";
import { SettingsTab } from "./settings-tab"

export default class Plugin extends ObsidianPlugin {
  public static instance: Plugin;

  constructor(_: App, manifest: PluginManifest) {
    super(app, manifest);
    Plugin.instance = this;
    console.info("Loading Mind Map plugin");

    this.setup();
  }

  private async setup() {
    const loadData = this.loadData.bind(this);
    const saveData = this.saveData.bind(this);

    const { settings, createSettingsTab } = await manageFilesystemData(loadData, saveData);
    this.addSettingTab(createSettingsTab(SettingsTab));

    this.registerView( MM_VIEW_TYPE, (leaf: WorkspaceLeaf) => new View(settings, leaf));
    this.registerMarkdownCodeBlockProcessor("markmap", inlineRenderer(settings));
    settingChanges.listen("highlight", () => {})

    this.addCommand({
      id: "app:markmap-preview",
      name: "View the current note as a Mind Map",
      callback: () => this.initPreview(settings),
      hotkeys: [],
    });

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
    console.info("Unloading Mind Map plugin");
  }

  activeLeafName(workspace: Workspace) {
    return workspace.activeLeaf?.getDisplayText();
  }
}
