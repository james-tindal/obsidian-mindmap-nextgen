import { PluginSettingTab, Setting, SplitDirection } from "obsidian";
import { Coloring, GlobalSettings, ScreenshotBgStyle } from "./filesystem";

import Plugin from "./main";


export class SettingsTab extends PluginSettingTab {
  constructor(settings: GlobalSettings) {
    super(app, Plugin.instance);

    const sections = [
      SectionGeneral,
      SectionColoring,
      SectionThickness,
      SectionScreenshots,
      SectionMarkmap
    ]

    this.containerEl.append(...sections.map(section => section(settings)))
  }

  public display() {}
}

const fragment = () => new DocumentFragment as unknown as HTMLElement;

function SectionGeneral(settings: GlobalSettings) {
  const section = fragment();

  new Setting(section)
  .setName("Split direction")
  .setDesc("Direction to split the window when opening a mindmap")
  .addDropdown((dropDown) => dropDown
    .addOption("horizontal", "Horizontal")
    .addOption("vertical", "Vertical")
    .setValue(settings.splitDirection)
    .onChange((value: SplitDirection) =>
      settings.splitDirection = value
  ));

  new Setting(section)
    .setName("Highlight inline mindmap")
    .setDesc("Use a contrasting background color for inline mindmaps")
    .addToggle((toggle) => toggle
      .setValue(settings.highlight)
      .onChange((value) =>
        settings.highlight = value
      ));

  new Setting(section)
    .setName("Use title as root node")
    .setDesc(
      "When on, the root node of the mindmap will be the title of the document"
    )
    .addToggle((toggle) => toggle
      .setValue(settings.titleAsRootNode)
      .onChange((value) =>
        settings.titleAsRootNode = value
      ));

  new Setting(section)
    .setName("Use theme font")
    .setDesc(
      "Should mindmaps use the same font as your Obsidian theme, or the default?"
    )
    .addToggle((toggle) => toggle
      .setValue(settings.useThemeFont)
      .onChange((value) =>
        settings.useThemeFont = value
      ));
  
  return section;
}

type ColorSettings = Record<number | "default" | "single" | "freezeLevel", Setting>

function SectionColoring(settings: GlobalSettings) {
  const section = fragment();
  const colors = {} as ColorSettings;

  function render() {
    const approach = settings.coloring;
    const { freezeLevel, single } = colors;
    const options = {
      branch: [descriptions.branch, freezeLevel],
      depth:  [descriptions.depth,  colors[1], colors[2], colors[3], colors.default],
      single: [descriptions.single, single]
    };
    Object.values(colors).forEach(setting => setting.settingEl.hidden = true);
    Object.values(descriptions).forEach(setting => setting.settingEl.hidden = true);
    options[approach].forEach(setting => setting.settingEl.hidden = false);
  }



  new Setting(section)
    .setHeading()
    .setName("Coloring");

  new Setting(section)
    .setName("Coloring approach")
    .addDropdown((dropDown) => dropDown
      .addOption("depth", "Depth-based coloring")
      .addOption("branch", "Branch-based coloring")
      .addOption("single", "Single color")
      .setValue(settings.coloring)
      .onChange((value: Coloring) => {
        settings.coloring = value;
        render();
      })
    );

  
  const descriptions = {
    branch: new Setting(section)
      .setDesc(`This mode will choose random colors per branch`),
    depth: new Setting(section)
      .setDesc(`In this mode, branches are colored based on their depth in the mindmap`),
    single: new Setting(section)
      .setDesc("In this mode, all branches are the same color.")
  }
  Object.values(descriptions).forEach(setting => setting.settingEl.classList.add('mmng-coloring-approach-description'));

  colors[1] = new Setting(section)
    .setName("Depth 1 color")
    .setDesc("Color for the first level of the mindmap")
    .addColorPicker((colPicker) => colPicker
      .setValue(settings.depth1Color)
      .onChange((value: string) =>
        settings.depth1Color = value)
    );

  colors[2] = new Setting(section)
    .setName("Depth 2 color")
    .setDesc("Color for the second level of the mindmap")
    .addColorPicker((colPicker) => colPicker
      .setValue(settings.depth2Color)
      .onChange((value: string) =>
        settings.depth2Color = value)
    );

  colors[3] = new Setting(section)
    .setName("Depth 3 color")
    .setDesc("Color for the third level of the mindmap")
    .addColorPicker((colPicker) => colPicker
      .setValue(settings.depth3Color)
      .onChange((value: string) =>
        settings.depth3Color = value)
    );

  colors.default = new Setting(section)
    .setName("Default color")
    .setDesc("Color for fourth level and beyond")
    .addColorPicker((colPicker) => colPicker
      .setValue(settings.defaultColor)
      .onChange((value: string) =>
        settings.defaultColor = value)
    );

  colors.single = new Setting(section)
    .setName("Color")
    .addColorPicker((colPicker) => colPicker
      .setValue(settings.defaultColor)
      .onChange((value: string) =>
        settings.defaultColor = value)
    );

  colors.freezeLevel = new Setting(section)
    .setName("Color freeze level")
    .setDesc(
      "All child branches will use the color of their ancestor node beyond the freeze level"
    )
    .addText((text) => text
      .setValue(settings.colorFreezeLevel.toString())
      .setPlaceholder("Example: 3")
      .onChange((value: string) =>
        settings.colorFreezeLevel = Number.parseInt(value))
    );

  render();

  return section;
}


function SectionThickness(settings: GlobalSettings) {
  const section = fragment();

  new Setting(section)
    .setHeading()
    .setName("Line thickness")
    .setDesc("Measured in pixels");

  new Setting(section)
    .setName("Depth 1")
    .addText((slider) => slider
      .setValue(settings.depth1Thickness)
      .onChange((value) => {
        if (Boolean(parseFloat(value.replace(/[^0-9\.]/g, ""))))
          settings.depth1Thickness = value
      })
    );

  new Setting(section)
    .setName("Depth 2")
    .addText((slider) => slider
      .setValue(settings.depth2Thickness)
      .onChange((value) =>
        settings.depth2Thickness = value)
    );

  new Setting(section)
    .setName("Depth 3")
    .addText((text) => text
      .setValue(settings.depth3Thickness)
      .onChange((value) =>
        settings.depth3Thickness = value)
    );

  new Setting(section)
    .setName("Default")
    .setDesc("Thickness for levels deeper than three")
    .addText((slider) => slider
      .setValue(settings.defaultThickness)
      .onChange((value) =>
        settings.defaultThickness = value)
    );

  return section
}


function SectionScreenshots(settings: GlobalSettings) {
  const section = fragment();

  new Setting(section)
    .setHeading()
    .setName("Screenshots")
    .setDesc(
      "Choose how you want your screenshots to look"
    );

  new Setting(section)
    .setName("Screenshot text color")
    .setDesc(
      "Text color for the screenshot. Toggle the switch on and off to disable/enable this color on the screenshot"
    )
    .addColorPicker((colPicker) => colPicker
      .setValue(settings.screenshotTextColor)
      .onChange((value: string) =>
        settings.screenshotTextColor = value)
    )
    .addToggle((toggle) => toggle
      .setValue(settings.screenshotTextColorEnabled)
      .onChange((value) =>
        settings.screenshotTextColorEnabled = value)
    );
  
  new Setting(section)
    .setName("Screenshot background style")
    .setDesc(
      `Select the background style for the screenshot, when using "Color" the color picker value will be used`
    )
    .addDropdown((dropdown) => dropdown
      .addOptions({
        [ScreenshotBgStyle.Transparent]: "Transparent",
        [ScreenshotBgStyle.Color]: "Color",
        [ScreenshotBgStyle.Theme]: "Theme",
      })
      .setValue(settings.screenshotBgStyle)
      .onChange((value: ScreenshotBgStyle) =>
        settings.screenshotBgStyle = value)
    )
    .addColorPicker((colPicker) => colPicker
      .setValue(settings.screenshotBgColor)
      .onChange((value: string) =>
        settings.screenshotBgColor = value)
    );

  return section
}


function SectionMarkmap(settings: GlobalSettings) {
  const section = fragment();

  new Setting(section)
    .setHeading()
    .setName("Markmap settings")
    .setDesc(
      "Settings for adjusting how Markmap draws the mindmaps"
    );

  new Setting(section)
    .setName("Node Min Height")
    .setDesc("Minimum height for the mindmap nodes")
    .addText((text) => text
      .setValue(settings.nodeMinHeight.toString())
      .setPlaceholder("Example: 16")
      .onChange((value: string) =>
        settings.nodeMinHeight = Number.parseInt(value)
    ));

  new Setting(section)
    .setName("Node Text Line Height")
    .setDesc("Line height for content in mindmap nodes")
    .addText((text) => text
      .setValue(settings.lineHeight)
      .setPlaceholder("Example: 1em")
      .onChange((value: string) =>
        settings.lineHeight = value)
    );

  new Setting(section)
    .setName("Vertical Spacing")
    .setDesc("Vertical spacing of the mindmap nodes")
    .addText((text) => text
      .setValue(settings.spacingVertical.toString())
      .setPlaceholder("Example: 5")
      .onChange((value: string) =>
        settings.spacingVertical = Number.parseInt(value))
    );

  new Setting(section)
    .setName("Horizontal Spacing")
    .setDesc("Horizontal spacing of the mindmap nodes")
    .addText((text) => text
      .setValue(settings.spacingHorizontal.toString())
      .setPlaceholder("Example: 80")
      .onChange((value: string) =>
        settings.spacingHorizontal = Number.parseInt(value))
    );

  new Setting(section)
    .setName("Horizontal padding")
    .setDesc("Leading space before the content of mindmap nodes")
    .addText((text) => text
      .setValue(settings.paddingX.toString())
      .setPlaceholder("Example: 8")
      .onChange((value: string) =>
        settings.paddingX = Number.parseInt(value))
    );

  new Setting(section)
    .setName("Initial expand level")
    .setDesc(
      "Sets the initial depth of the mindmap. 0 means all nodes are collapsed, 1 means only the root node is expanded, etc. To expand all nodes, set this to -1"
    )
    .addText((text) => text
      .setValue(settings.initialExpandLevel.toString())
      .setPlaceholder("Example: 2")
      .onChange((value: string) =>
        settings.initialExpandLevel = Number.parseInt(value))
    );

  new Setting(section)
    .setName("Animation duration")
    .setDesc("The animation duration when folding/unfolding a node")
    .addText((text) => text
      .setValue(settings.animationDuration.toString())
      .setPlaceholder("Example: 500")
      .onChange((value: string) =>
        settings.animationDuration = Number.parseInt(value))
    );

  new Setting(section)
    .setName("Max width")
    .setDesc("The max width of each node. 0 for no limit")
    .addText((text) => text
      .setValue(settings.maxWidth.toString())
      .setPlaceholder("Example: 130")
      .onChange((value: string) =>
        settings.maxWidth = Number.parseInt(value))
    );

  return section
}