import { PluginSettingTab, Setting, SplitDirection } from "obsidian";
import { Coloring, PluginSettings, ScreenshotBgStyle } from "./filesystem";

import Plugin from "./main";

type ColorSettings = Record<number | "default" | "freeze", Setting>

export class SettingsTab extends PluginSettingTab {
  private settings: PluginSettings;
  private colorSettings: ColorSettings = {} as ColorSettings;

  constructor(settings: PluginSettings) {
    super(app, Plugin.instance);
    this.settings = settings;
  }

  decideDisplayColors() {
    const approach = this.settings.coloring;
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
        .setValue(this.settings.splitDirection)
        .onChange((value: SplitDirection) =>
          this.settings.splitDirection = value
      ));

    new Setting(containerEl)
      .setName("Node Min Height")
      .setDesc("Minimum height for the mind map nodes")
      .addText((text) => text
        .setValue(this.settings.nodeMinHeight.toString())
        .setPlaceholder("Example: 16")
        .onChange((value: string) =>
          this.settings.nodeMinHeight = Number.parseInt(value)
      ));

    new Setting(containerEl)
      .setName("Node Text Line Height")
      .setDesc("Line height for content in mind map nodes")
      .addText((text) => text
        .setValue(this.settings.lineHeight)
        .setPlaceholder("Example: 1em")
        .onChange((value: string) =>
          this.settings.lineHeight = value)
      );

    new Setting(containerEl)
      .setName("Vertical Spacing")
      .setDesc("Vertical spacing of the mind map nodes")
      .addText((text) => text
        .setValue(this.settings.spacingVertical.toString())
        .setPlaceholder("Example: 5")
        .onChange((value: string) =>
          this.settings.spacingVertical = Number.parseInt(value))
      );

    new Setting(containerEl)
      .setName("Horizontal Spacing")
      .setDesc("Horizontal spacing of the mind map nodes")
      .addText((text) => text
        .setValue(this.settings.spacingHorizontal.toString())
        .setPlaceholder("Example: 80")
        .onChange((value: string) =>
          this.settings.spacingHorizontal = Number.parseInt(value))
      );

    new Setting(containerEl)
      .setName("Horizontal padding")
      .setDesc("Leading space before the content of mind map nodes")
      .addText((text) => text
        .setValue(this.settings.paddingX.toString())
        .setPlaceholder("Example: 8")
        .onChange((value: string) =>
          this.settings.paddingX = Number.parseInt(value))
      );

    new Setting(containerEl)
      .setName("Initial expand level")
      .setDesc(
        "Sets the initial depth of the mind map. 0 means all nodes are collapsed, 1 means only the root node is expanded, etc.\nTo expand all nodes, set this to -1."
      )
      .addText((text) => text
        .setValue(this.settings.initialExpandLevel.toString())
        .setPlaceholder("Example: 2")
        .onChange((value: string) =>
          this.settings.initialExpandLevel = Number.parseInt(value))
      );

    new Setting(containerEl)
      .setName("Screenshot text color")
      .setDesc(
        "Text color for the screenshot. Toggle the switch on and off to disable/enable this color on the screenshot."
      )
      .addColorPicker((colPicker) => colPicker
        .setValue(this.settings.screenshotTextColor)
        .onChange((value: string) =>
          this.settings.screenshotTextColor = value)
      )
      .addToggle((toggle) => toggle
        .setValue(this.settings.screenshotTextColorEnabled)
        .onChange((value) =>
          this.settings.screenshotTextColorEnabled = value)
      );
      
      new Setting(containerEl)
        .setName("Screenshot background style")
        .setDesc(
          `Select the background style for the screenshot, when using "Color" the color picker value will be used.`
        )
        .addDropdown((dropdown) => dropdown
          .addOptions({
            [ScreenshotBgStyle.Transparent]: "Transparent",
            [ScreenshotBgStyle.Color]: "Color",
            [ScreenshotBgStyle.Theme]: "Theme",
          })
          .setValue(this.settings.screenshotBgStyle)
          .onChange((value: ScreenshotBgStyle) =>
            this.settings.screenshotBgStyle = value)
        )
        .addColorPicker((colPicker) => colPicker
          .setValue(this.settings.screenshotBgColor)
          .onChange((value: string) =>
            this.settings.screenshotBgColor = value)
        );

    // animation duration
    new Setting(containerEl)
      .setName("Animation duration")
      .setDesc("The animation duration when folding/unfolding a node.")
      .addText((text) => text
        .setValue(this.settings.animationDuration.toString())
        .setPlaceholder("Example: 500")
        .onChange((value: string) =>
          this.settings.animationDuration = Number.parseInt(value))
      );

    // max width
    new Setting(containerEl)
      .setName("Max width")
      .setDesc("The max width of each node content. 0 for no limit.")
      .addText((text) => text
        .setValue(this.settings.maxWidth.toString())
        .setPlaceholder("Example: 130")
        .onChange((value: string) =>
          this.settings.maxWidth = Number.parseInt(value))
      );

    new Setting(containerEl)
      .setName("Highlight inline markmap")
      .setDesc(
        "When on, the inline markmap will be highlighted. Which means having a border and a different background color"
      )
      .addToggle((toggle) => toggle
        .setValue(this.settings.highlight)
        .onChange((value) =>
          this.settings.highlight = value
        ));

      new Setting(containerEl)
        .setName("Use title as root node")
        .setDesc(
          "When on, the root node of the mindmap will be the title of the document."
        )
        .addToggle((toggle) => toggle
          .setValue(this.settings.titleAsRootNode)
          .onChange((value) =>
            this.settings.titleAsRootNode = value
          ));

      new Setting(containerEl)
        .setName("Use theme font")
        .setDesc(
          "Should mindmaps use the same font as your Obsidian theme, or the default?"
        )
        .addToggle((toggle) => toggle
          .setValue(this.settings.useThemeFont)
          .onChange((value) =>
            this.settings.useThemeFont = value
          ));

      // Mind map coloring settings

      new Setting(containerEl)
        .setHeading()
        .setName("Coloring");

      new Setting(containerEl)
      .setName("Coloring approach")
      .setDesc(
        `The "depth" changes the color on each level, "branch" changes the color on each new branch`
      )
      .addDropdown((dropDown) => dropDown
        .addOption("depth", "Depth based coloring")
        .addOption("branch", "Branch based coloring")
        .addOption("single", "Single color")
        .setValue(this.settings.coloring)
        .onChange((value: Coloring) => {
          this.settings.coloring = value;
          this.decideDisplayColors();
        })
      );
  
      this.colorSettings[1] = new Setting(containerEl)
        .setName("Depth 1 color")
        .setDesc("Color for the first level of the mind map")
        .addColorPicker((colPicker) => colPicker
          .setValue(this.settings.depth1Color)
          .onChange((value: string) =>
            this.settings.depth1Color = value)
        );
  
      new Setting(containerEl)
        .setName("Depth 1 thickness")
        .setDesc("Depth 1 thickness in pixels")
        .addText((slider) => slider
          .setValue(this.settings.depth1Thickness)
          .onChange((value) => {
            if (Boolean(parseFloat(value.replace(/[^0-9\.]/g, ""))))
              this.settings.depth1Thickness = value
          })
        );
  
      this.colorSettings[2] = new Setting(containerEl)
        .setName("Depth 2 color")
        .setDesc("Color for the second level of the mind map")
        .addColorPicker((colPicker) => colPicker
          .setValue(this.settings.depth2Color)
          .onChange((value: string) =>
            this.settings.depth2Color = value)
        );
  
      new Setting(containerEl)
        .setName("Depth 2 thickness")
        .setDesc("Depth 2 thickness in pixels")
        .addText((slider) => slider
          .setValue(this.settings.depth2Thickness)
          .onChange((value) =>
            this.settings.depth2Thickness = value)
        );
  
      this.colorSettings[3] = new Setting(containerEl)
        .setName("Depth 3 color")
        .setDesc("Color for the third level of the mind map")
        .addColorPicker((colPicker) => colPicker
          .setValue(this.settings.depth3Color)
          .onChange((value: string) =>
            this.settings.depth3Color = value)
        );
  
      new Setting(containerEl)
        .setName("Depth 3 thickness")
        .setDesc("Depth 3 thickness in pixels")
        .addText((text) => text
          .setValue(this.settings.depth3Thickness)
          .onChange((value) =>
            this.settings.depth3Thickness = value)
        );
  
      this.colorSettings.default = new Setting(containerEl)
        .setName("Default Color")
        .setDesc("Color for fourth level and beyond")
        .addColorPicker((colPicker) => colPicker
          .setValue(this.settings.defaultColor)
          .onChange((value: string) =>
            this.settings.defaultColor = value)
        );
  
      new Setting(containerEl)
        .setName("Default thickness")
        .setDesc("Thickness for levels deeper than three, in pixels")
        .addText((slider) => slider
          .setValue(this.settings.defaultThickness)
          .onChange((value) =>
            this.settings.defaultThickness = value)
        );
  
      this.colorSettings.freeze = new Setting(containerEl)
        .setName("Color freeze level")
        .setDesc(
          "All child branches will use the color of their ancestor node beyond the freeze level."
        )
        .addText((text) => text
          .setValue(this.settings.colorFreezeLevel.toString())
          .setPlaceholder("Example: 3")
          .onChange((value: string) =>
            this.settings.colorFreezeLevel = Number.parseInt(value))
        );

    this.decideDisplayColors();
  }
}
