import { App, PluginSettingTab, Setting, SplitDirection } from "obsidian";
import MindMap from "./main";
import { MindMapSettings } from "./settings";

export class MindMapSettingsTab extends PluginSettingTab {
  plugin: MindMap;
  constructor(app: App, plugin: MindMap) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    const save = () => {
      this.plugin.saveData(this.plugin.settings);
      this.app.workspace.trigger("css-change");
    };

    new Setting(containerEl)
      .setName("Preview Split")
      .setDesc("Split direction for the Mind Map Preview")
      .addDropdown((dropDown) =>
        dropDown
          .addOption("horizontal", "Horizontal")
          .addOption("vertical", "Vertical")
          .setValue(this.plugin.settings.splitDirection || "horizontal")
          .onChange((value: string) => {
            this.plugin.settings.splitDirection = value as SplitDirection;
            save();
          })
      );

    new Setting(containerEl)
      .setName("Node Min Height")
      .setDesc("Minimum height for the mind map nodes")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.nodeMinHeight?.toString())
          .setPlaceholder("Example: 16")
          .onChange((value: string) => {
            this.plugin.settings.nodeMinHeight = Number.parseInt(value);
            save();
          })
      );

    new Setting(containerEl)
      .setName("Node Text Line Height")
      .setDesc("Line height for content in mind map nodes")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.lineHeight?.toString())
          .setPlaceholder("Example: 1em")
          .onChange((value: string) => {
            this.plugin.settings.lineHeight = value;
            save();
          })
      );

    new Setting(containerEl)
      .setName("Vertical Spacing")
      .setDesc("Vertical spacing of the mind map nodes")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.spacingVertical?.toString())
          .setPlaceholder("Example: 5")
          .onChange((value: string) => {
            this.plugin.settings.spacingVertical = Number.parseInt(value);
            save();
          })
      );

    new Setting(containerEl)
      .setName("Horizontal Spacing")
      .setDesc("Horizontal spacing of the mind map nodes")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.spacingHorizontal?.toString())
          .setPlaceholder("Example: 80")
          .onChange((value: string) => {
            this.plugin.settings.spacingHorizontal = Number.parseInt(value);
            save();
          })
      );

    new Setting(containerEl)
      .setName("Horizontal padding")
      .setDesc("Leading space before the content of mind map nodes")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.paddingX?.toString())
          .setPlaceholder("Example: 8")
          .onChange((value: string) => {
            this.plugin.settings.paddingX = Number.parseInt(value);
            save();
          })
      );

    new Setting(containerEl)
      .setName("Horizontal padding")
      .setDesc("Leading space before the content of mind map nodes")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.paddingX?.toString())
          .setPlaceholder("Example: 8")
          .onChange((value: string) => {
            this.plugin.settings.paddingX = Number.parseInt(value);
            save();
          })
      );

    // add 3 colors settings and default color setting

    new Setting(containerEl)
      .setName("Color 1")
      .setDesc("Color for the first level of the mind map")
      .addColorPicker((colPicker) =>
        colPicker
          .setValue(this.plugin.settings.color1?.toString())
          .onChange((value: string) => {
            this.plugin.settings.color1 = value;
            save();
          })
      );

    new Setting(containerEl)
      .setName("Color 2")
      .setDesc("Color for the second level of the mind map")
      .addColorPicker((colPicker) =>
        colPicker
          .setValue(this.plugin.settings.color2?.toString())
          .onChange((value: string) => {
            this.plugin.settings.color2 = value;
            save();
          })
      );

    new Setting(containerEl)
      .setName("Color 3")
      .setDesc("Color for the third level of the mind map")
      .addColorPicker((colPicker) =>
        colPicker
          .setValue(this.plugin.settings.color3?.toString())
          .onChange((value: string) => {
            this.plugin.settings.color3 = value;
            save();
          })
      );

    new Setting(containerEl)
      .setName("Default Color")
      .setDesc("Color for level 4 and beyond")
      .addColorPicker((colPicker) =>
        colPicker
          .setValue(this.plugin.settings.defaultColor?.toString())
          .onChange((value: string) => {
            this.plugin.settings.defaultColor = value;
            save();
          })
      );
  }
}
