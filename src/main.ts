import { App, Plugin as ObsidianPlugin, PluginManifest } from "obsidian";
import { inlineRenderer } from "src/rendering/inline-renderer";
import { FilesystemManager } from "src/filesystem";
import { SettingsTab } from "src/settings-tab"
import { ViewManager } from "src/views/view-manager"
import { LayoutManager } from "src/views/layout-manager"


export default class Plugin extends ObsidianPlugin {
  public static instance: Plugin;

  constructor(_: App, manifest: PluginManifest) {
    super(app, manifest);
    Plugin.instance = this;
    console.info("Loading Mindmap plugin");

    this.setup();
  }

  private async setup() {
    const loadData = this.loadData.bind(this);
    const saveData = this.saveData.bind(this);

    const { settings, createSettingsTab, saveLayout, loadLayout } = await FilesystemManager(loadData, saveData);
    this.addSettingTab(createSettingsTab(SettingsTab));

    const layoutManager = LayoutManager(saveLayout, loadLayout);

    ViewManager(this, settings, layoutManager);

    this.registerMarkdownCodeBlockProcessor("markmap", inlineRenderer(settings));
  }

  public async onunload() {
    console.info("Unloading Mindmap plugin");
  }
}
