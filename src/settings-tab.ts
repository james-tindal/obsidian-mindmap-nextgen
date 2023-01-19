import { PluginSettingTab, Setting, SplitDirection } from "obsidian";
import { ScreenshotBgStyle, SettingsManager } from "./filesystem-data";

import Plugin from "./main";

type ColorSettings = Record<number | 'default' | 'freeze', Setting>

export class SettingsTab extends PluginSettingTab {
  settings: SettingsManager;
  colorSettings: ColorSettings;

  constructor(plugin: Plugin, settings: SettingsManager) {
    super(app, plugin);
    this.settings = settings;
    this.colorSettings = {} as ColorSettings;
  }

  decideDisplayColors() {
    const approach = this.settings.get('coloring');
    const colors = this.colorSettings;
    const freeze = this.colorSettings.freeze;
    const options = {
      branch: [freeze],
      depth: [colors[1], colors[2], colors[3], colors.default],
      single: [colors.default]
    };
    Object.values(this.colorSettings).forEach(setting => setting.settingEl.hidden = true);
    options[approach].forEach(setting => setting.settingEl.hidden = false);
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Preview Split")
      .setDesc("Split direction for the Mind Map Preview")
      .addDropdown((dropDown) => dropDown
        .addOption("horizontal", "Horizontal")
        .addOption("vertical", "Vertical")
        .setValue(this.settings.get('splitDirection'))
        .onChange((value: SplitDirection) =>
          this.settings.set('splitDirection', value))
      );

    new Setting(containerEl)
      .setName("Node Min Height")
      .setDesc("Minimum height for the mind map nodes")
      .addText((text) => text
        .setValue(this.settings.get("nodeMinHeight").toString())
        .setPlaceholder("Example: 16")
        .onChange((value: string) =>
          this.settings.set("nodeMinHeight", Number.parseInt(value)))
      );

    new Setting(containerEl)
      .setName("Node Text Line Height")
      .setDesc("Line height for content in mind map nodes")
      .addText((text) => text
        .setValue(this.settings.get("lineHeight"))
        .setPlaceholder("Example: 1em")
        .onChange((value: string) =>
          this.settings.set("lineHeight", value))
      );

    new Setting(containerEl)
      .setName("Vertical Spacing")
      .setDesc("Vertical spacing of the mind map nodes")
      .addText((text) => text
        .setValue(this.settings.get("spacingVertical").toString())
        .setPlaceholder("Example: 5")
        .onChange((value: string) =>
          this.settings.set("spacingVertical", Number.parseInt(value)))
      );

    new Setting(containerEl)
      .setName("Horizontal Spacing")
      .setDesc("Horizontal spacing of the mind map nodes")
      .addText((text) => text
        .setValue(this.settings.get("spacingHorizontal").toString())
        .setPlaceholder("Example: 80")
        .onChange((value: string) =>
          this.settings.set("spacingHorizontal", Number.parseInt(value)))
      );

    new Setting(containerEl)
      .setName("Horizontal padding")
      .setDesc("Leading space before the content of mind map nodes")
      .addText((text) => text
        .setValue(this.settings.get("paddingX").toString())
        .setPlaceholder("Example: 8")
        .onChange((value: string) =>
          this.settings.set("paddingX", Number.parseInt(value)))
      );

    new Setting(containerEl)
      .setName("Initial expand level")
      .setDesc(
        "Sets the initial depth of the mind map. 0 means all nodes are collapsed, 1 means only the root node is expanded, etc.\nTo expand all nodes, set this to -1."
      )
      .addText((text) => text
        .setValue(this.settings.get("initialExpandLevel").toString())
        .setPlaceholder("Example: 2")
        .onChange((value: string) =>
          this.settings.set("initialExpandLevel", Number.parseInt(value)))
      );

    new Setting(containerEl)
      .setName("Screenshot text color")
      .setDesc(
        "Text color for the screenshot. Toggle the switch on and off to disable/enable this color on the screenshot."
      )
      .addColorPicker((colPicker) => colPicker
        .setValue(this.settings.get("screenshotTextColor"))
        .onChange((value: string) =>
          this.settings.set("screenshotTextColor", value))
      )
      .addToggle((toggle) => toggle
        .setValue(this.settings.get("screenshotTextColorEnabled"))
        .onChange((value) =>
          this.settings.set("screenshotTextColorEnabled", value))
      );
      
      new Setting(containerEl)
        .setName("Screenshot background style")
        .setDesc(
          "Select the background style for the screenshot, when using 'Color' the color picker value will be used."
        )
        .addDropdown((dropdown) => dropdown
          .addOptions({
            [ScreenshotBgStyle.Transparent]: "Transparent",
            [ScreenshotBgStyle.Color]: "Color",
            [ScreenshotBgStyle.Theme]: "Theme",
          })
          .setValue(this.settings.get("screenshotBgStyle"))
          .onChange((value: ScreenshotBgStyle) =>
            this.settings.set("screenshotBgStyle", value))
        )
        .addColorPicker((colPicker) => colPicker
          .setValue(this.settings.get("screenshotBgColor"))
          .onChange((value: string) =>
            this.settings.set("screenshotBgColor", value))
        );

    // animation duration
    new Setting(containerEl)
      .setName("Animation duration")
      .setDesc("The animation duration when folding/unfolding a node.")
      .addText((text) => text
        .setValue(this.settings.get("animationDuration").toString())
        .setPlaceholder("Example: 500")
        .onChange((value: string) =>
          this.settings.set("animationDuration", Number.parseInt(value)))
      );

    // max width
    new Setting(containerEl)
      .setName("Max width")
      .setDesc("The max width of each node content. 0 for no limit.")
      .addText((text) => text
        .setValue(this.settings.get("maxWidth").toString())
        .setPlaceholder("Example: 130")
        .onChange((value: string) =>
          this.settings.set("maxWidth", Number.parseInt(value)))
      );

    new Setting(containerEl)
      .setName("Highlight inline markmap")
      .setDesc(
        "When on, the inline markmap will be highlighted. Which means having a border and a different background color"
      )
      .addToggle((toggle) => toggle
        .setValue(this.settings.get("highlight"))
        .onChange((value) =>
          this.settings.set("highlight", value))
      );

      new Setting(containerEl)
        .setHeading()
        .setName('Coloring approach')

      new Setting(containerEl)
      .setName("Coloring approach")
      .setDesc(
        "The 'depth' changes the color on each level, 'branch' changes the color on each new branch"
      )
      .addDropdown((dropDown) => dropDown
        .addOption("depth", "Depth based coloring")
        .addOption("branch", "Branch based coloring")
        .addOption("single", "Single color")
        .setValue(this.settings.get("coloring") || "depth")
        .onChange((value: "branch" | "depth" | "single") => {
          this.settings.set("coloring", value);
          this.decideDisplayColors();
        })
      );
  
      this.colorSettings[1] = new Setting(containerEl)
        .setName("Depth 1 color")
        .setDesc("Color for the first level of the mind map")
        .addColorPicker((colPicker) => colPicker
          .setValue(this.settings.get("depth1Color"))
          .onChange((value: string) =>
            this.settings.set("depth1Color", value))
        );
  
      new Setting(containerEl)
        .setName("Depth 1 thickness")
        .setDesc("Depth 1 thickness in pixels")
        .addText((slider) => slider
          .setValue(this.settings.get("depth1Thickness"))
          .onChange((value) => {
            if (Boolean(parseFloat(value.replace(/[^0-9\.]/g, ""))))
              this.settings.set("depth1Thickness", value)
          })
        );
  
      this.colorSettings[2] = new Setting(containerEl)
        .setName("Depth 2 color")
        .setDesc("Color for the second level of the mind map")
        .addColorPicker((colPicker) => colPicker
          .setValue(this.settings.get("depth2Color"))
          .onChange((value: string) =>
            this.settings.set("depth2Color", value))
        );
  
      new Setting(containerEl)
        .setName("Depth 2 thickness")
        .setDesc("Depth 2 thickness in pixels")
        .addText((slider) => slider
          .setValue(this.settings.get("depth2Thickness"))
          .onChange((value) =>
            this.settings.set("depth2Thickness", value))
        );
  
      this.colorSettings[3] = new Setting(containerEl)
        .setName("Depth 3 color")
        .setDesc("Color for the third level of the mind map")
        .addColorPicker((colPicker) => colPicker
          .setValue(this.settings.get("depth3Color"))
          .onChange((value: string) =>
            this.settings.set("depth3Color", value))
        );
  
      new Setting(containerEl)
        .setName("Color 3 thickness")
        .setDesc("Color 3 thickness in pixels")
        .addText((text) => text
          .setValue(this.settings.get("depth3Thickness"))
          .onChange((value) =>
            this.settings.set("depth3Thickness", value))
        );
  
      this.colorSettings.default = new Setting(containerEl)
        .setName("Default Color")
        .setDesc("Color for fourth level and beyond")
        .addColorPicker((colPicker) => colPicker
          .setValue(this.settings.get("defaultColor"))
          .onChange((value: string) =>
            this.settings.set("defaultColor", value))
        );
  
      new Setting(containerEl)
        .setName("Default thickness")
        .setDesc("Thickness for levels deeper than three, in pixels")
        .addText((slider) => slider
          .setValue(this.settings.get("defaultThickness"))
          .onChange((value) =>
            this.settings.set("defaultThickness", value))
        );
  
      this.colorSettings.freeze = new Setting(containerEl)
        .setName("Color freeze level")
        .setDesc(
          "All child branches will use the color of their ancestor node beyond the freeze level."
        )
        .addText((text) => text
          .setValue(this.settings.get("colorFreezeLevel").toString())
          .setPlaceholder("Example: 3")
          .onChange((value: string) =>
            this.settings.set("colorFreezeLevel", Number.parseInt(value)))
        );

    this.decideDisplayColors();
  }
}
