import { App, PluginSettingTab, Setting, SplitDirection } from "obsidian";

import MindMap from "./main";
import { ScreenshotBgStyle } from "./@types/screenshot";

type ColorSettings = Record<number | 'default', Setting>

export class MindMapSettingsTab extends PluginSettingTab {
  plugin: MindMap;
  colorSettings: ColorSettings;
  constructor(app: App, plugin: MindMap) {
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
      .setName("Color 1 thickness")
      .setDesc("Color 1 thickess in points (px)")
      .addText((slider) =>
        slider
          .setValue(this.plugin.settings.color1Thickness)
          .onChange((value) => {
            if (Boolean(parseFloat(value.replace(/[^0-9\.]/g, "")))) {
              this.plugin.settings.color1Thickness = value;
              save();
            }
          })
      );

    this.colorSettings[2] = new Setting(containerEl)
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
      .setName("Color 2 thickness")
      .setDesc("Color 2 thickess in points (px)")
      .addText((slider) =>
        slider
          .setValue(this.plugin.settings.color2Thickness)
          .onChange((value) => {
            this.plugin.settings.color2Thickness = value;
            save();
          })
      );

    this.colorSettings[3] = new Setting(containerEl)
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
      .setName("Color 3 thickness")
      .setDesc("Color 3 thickess in points (px)")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.color3Thickness)
          .onChange((value) => {
            this.plugin.settings.color3Thickness = value;
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
      .setName("Default color thickness")
      .setDesc("Default color thickess in points (px)")
      .addText((slider) =>
        slider
          .setValue(this.plugin.settings.defaultColorThickness)
          .onChange((value) => {
            this.plugin.settings.defaultColorThickness = value;
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
        "Freeze color at the specified level of branches, i.e. all child branches will use the color of their ancestor node at the freeze level."
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
      .setName("Screenshot background color")
      .setDesc("Background color for the screenshot")
      .addColorPicker((colPicker) =>
        colPicker
          .setValue(this.plugin.settings.screenshotBgColor?.toString())
          .onChange((value: string) => {
            this.plugin.settings.screenshotBgColor = value;
            save();
          })
      );

    new Setting(containerEl)
      .setName("Screenshot foreground color")
      .setDesc(
        "Foreground color for the screenshot. Toggle the switch on and off to disable/enable this color on the screenshot."
      )
      .addColorPicker((colPicker) =>
        colPicker
          .setValue(this.plugin.settings.screenshotFgColor?.toString())
          .onChange((value: string) => {
            this.plugin.settings.screenshotFgColor = value;
            save();
          })
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.screenshotFgColorEnabled)
          .onChange((value) => {
            this.plugin.settings.screenshotFgColorEnabled = value;
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
    // add toggle to use transparent background for screenshot or not

    new Setting(containerEl)
      .setName("Screenshot background style")
      .setDesc(
        "Select the background style for the screenshot, when using 'Color' the color picker value will be used."
      )
      .addDropdown((dropdown) =>
        dropdown
          .setValue(this.plugin.settings.screenshotBgStyle)
          .addOptions({
            [ScreenshotBgStyle.Transparent]: "Transparent",
            [ScreenshotBgStyle.Color]: "Color",
            [ScreenshotBgStyle.Theme]: "Theme",
          })
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
