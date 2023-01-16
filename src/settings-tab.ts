import { App, PluginSettingTab, Setting, SplitDirection } from "obsidian";
import { ScreenshotBgStyle } from "./@types/settings";

import Plugin from "./main";

type ColorSettings = Record<number | 'default', Setting>

export class SettingsTab extends PluginSettingTab {
  plugin: Plugin;
  colorSettings: ColorSettings;
  constructor(app: App, plugin: Plugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.colorSettings = {} as ColorSettings;
  }

  decideDisplayColors() {
    const approach = this.plugin.settings.coloring;
    const colors = this.colorSettings;
    const options = {
      branch: [] as Setting[],
      depth: [colors[1], colors[2], colors[3], colors.default],
      single: [colors.default]
    };
    Object.values(this.colorSettings).forEach(setting => setting.settingEl.hidden = true);
    options[approach].forEach(setting => setting.settingEl.hidden = false);
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    const save = () => {
      this.plugin.saveData(this.plugin.settings);
      this.app.workspace.trigger("quick-preview");
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
    .setName("Coloring approach")
    .setDesc(
      "The 'depth' changes the color on each level, 'branch' changes the color on each new branch"
    )
    .addDropdown((dropDown) =>
      dropDown
        .addOption("depth", "Depth based coloring")
        .addOption("branch", "Branch based coloring")
        .addOption("single", "Single color")
        .setValue(this.plugin.settings.coloring || "depth")
        .onChange((value: "branch" | "depth" | "single") => {
          this.plugin.settings.coloring = value;
          save();
          this.decideDisplayColors();
        })
    );

    this.colorSettings[1] = new Setting(containerEl)
      .setName("Depth 1 color")
      .setDesc("Color for the first level of the mind map")
      .addColorPicker((colPicker) =>
        colPicker
          .setValue(this.plugin.settings.depth1Color?.toString())
          .onChange((value: string) => {
            this.plugin.settings.depth1Color = value;
            save();
          })
      );

    new Setting(containerEl)
      .setName("Depth 1 thickness")
      .setDesc("Depth 1 thickness in pixels")
      .addText((slider) =>
        slider
          .setValue(this.plugin.settings.depth1Thickness)
          .onChange((value) => {
            if (Boolean(parseFloat(value.replace(/[^0-9\.]/g, "")))) {
              this.plugin.settings.depth1Thickness = value;
              save();
            }
          })
      );

    this.colorSettings[2] = new Setting(containerEl)
      .setName("Depth 2 color")
      .setDesc("Color for the second level of the mind map")
      .addColorPicker((colPicker) =>
        colPicker
          .setValue(this.plugin.settings.depth2Color?.toString())
          .onChange((value: string) => {
            this.plugin.settings.depth2Color = value;
            save();
          })
      );

    new Setting(containerEl)
      .setName("Depth 2 thickness")
      .setDesc("Depth 2 thickness in pixels")
      .addText((slider) =>
        slider
          .setValue(this.plugin.settings.depth2Thickness)
          .onChange((value) => {
            this.plugin.settings.depth2Thickness = value;
            save();
          })
      );

    this.colorSettings[3] = new Setting(containerEl)
      .setName("Depth 3 color")
      .setDesc("Color for the third level of the mind map")
      .addColorPicker((colPicker) =>
        colPicker
          .setValue(this.plugin.settings.depth3Color?.toString())
          .onChange((value: string) => {
            this.plugin.settings.depth3Color = value;
            save();
          })
      );

    new Setting(containerEl)
      .setName("Color 3 thickness")
      .setDesc("Color 3 thickness in pixels")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.depth3Thickness)
          .onChange((value) => {
            this.plugin.settings.depth3Thickness = value;
            save();
          })
      );

    this.colorSettings.default = new Setting(containerEl)
      .setName("Default Color")
      .setDesc("Color for fourth level and beyond")
      .addColorPicker((colPicker) =>
        colPicker
          .setValue(this.plugin.settings.defaultColor?.toString())
          .onChange((value: string) => {
            this.plugin.settings.defaultColor = value;
            save();
          })
      );

    new Setting(containerEl)
      .setName("Default thickness")
      .setDesc("Thickness for levels deeper than three, in pixels")
      .addText((slider) =>
        slider
          .setValue(this.plugin.settings.defaultThickness)
          .onChange((value) => {
            this.plugin.settings.defaultThickness = value;
            save();
          })
      );

    new Setting(containerEl)
      .setName("Initial expand level")
      .setDesc(
        "Sets the initial depth of the mind map. 0 means all nodes are collapsed, 1 means only the root node is expanded, etc.\nTo expand all nodes, set this to -1."
      )
      .addText((text) =>
        text
          .setValue(this.plugin.settings.initialExpandLevel?.toString())
          .setPlaceholder("Example: 2")
          .onChange((value: string) => {
            this.plugin.settings.initialExpandLevel = Number.parseInt(value);
            save();
          })
      );

    new Setting(containerEl)
      .setName("Color freeze level")
      .setDesc(
        "All child branches will use the color of their ancestor node beyond the freeze level."
      )
      .addText((text) =>
        text
          .setValue(this.plugin.settings.colorFreezeLevel?.toString())
          .setPlaceholder("Example: 3")
          .onChange((value: string) => {
            this.plugin.settings.colorFreezeLevel = Number.parseInt(value);
            save();
          })
      );

    new Setting(containerEl)
      .setName("Screenshot text color")
      .setDesc(
        "Text color for the screenshot. Toggle the switch on and off to disable/enable this color on the screenshot."
      )
      .addColorPicker((colPicker) =>
        colPicker
          .setValue(this.plugin.settings.screenshotTextColor?.toString())
          .onChange((value: string) => {
            this.plugin.settings.screenshotTextColor = value;
            save();
          })
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.screenshotTextColorEnabled)
          .onChange((value) => {
            this.plugin.settings.screenshotTextColorEnabled = value;
            save();
          })
      );
      
      new Setting(containerEl)
        .setName("Screenshot background style")
        .setDesc(
          "Select the background style for the screenshot, when using 'Color' the color picker value will be used."
        )
        .addDropdown((dropdown) =>
          dropdown
            .addOptions({
              [ScreenshotBgStyle.Transparent]: "Transparent",
              [ScreenshotBgStyle.Color]: "Color",
              [ScreenshotBgStyle.Theme]: "Theme",
            })
            .setValue(this.plugin.settings.screenshotBgStyle)
            .onChange((value: ScreenshotBgStyle) => {
              this.plugin.settings.screenshotBgStyle = value;
              save();
            })
        )
        .addColorPicker((colPicker) =>
          colPicker
            .setValue(this.plugin.settings.screenshotBgColor?.toString())
            .onChange((value: string) => {
              this.plugin.settings.screenshotBgColor = value;
              save();
            })
        );

    // animation duration
    new Setting(containerEl)
      .setName("Animation duration")
      .setDesc("The animation duration when folding/unfolding a node.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.animationDuration?.toString())
          .setPlaceholder("Example: 500")
          .onChange((value: string) => {
            this.plugin.settings.animationDuration = Number.parseInt(value);
            save();
          })
      );

    // max width
    new Setting(containerEl)
      .setName("Max width")
      .setDesc("The max width of each node content. 0 for no limit.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.maxWidth?.toString())
          .setPlaceholder("Example: 130")
          .onChange((value: string) => {
            this.plugin.settings.maxWidth = Number.parseInt(value);
            save();
          })
      );

    new Setting(containerEl)
      .setName("Highlight inline markmap")
      .setDesc(
        "When on, the inline markmap will be highlighted. Which means having a border and a different background color"
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.highlight).onChange((value) => {
          this.plugin.settings.highlight = value;
          save();
        })
      );

    this.decideDisplayColors();
  }
}
