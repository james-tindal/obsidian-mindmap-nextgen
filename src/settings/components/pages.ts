import { Setting } from "obsidian"
import { CodeBlockSettings, Coloring, FileSettings, GlobalSettings, ScreenshotBgStyle } from "../filesystem"
import { Heading, HtmlComponent, fragment } from "./various"
import { SettingComponent, dropdown, numberText, text } from "./SettingComponent"



// -- SectionGeneral -- //

const SplitDirection = SettingComponent({
  name: "Split direction",
  description: "Direction to split the window when opening a mindmap",
  key: "splitDirection",
  control: dropdown(
    ["horizontal", "Horizontal"],
    ["vertical", "Vertical"])
})

const HighlightInlineMindmap = SettingComponent({
  name: "Highlight inline mindmap",
  description: "Use a contrasting background color for inline mindmaps",
  key: "highlight",
  control: "toggle"
})

const TitleAsRootNode = SettingComponent({
  name: "Use title as root node",
  description: "When on, the root node of the mindmap will be the title of the document",
  key: "titleAsRootNode",
  control: "toggle"
})

const UseThemeFont = SettingComponent({
  name: "Use theme font",
  description: "Should mindmaps use the same font as your Obsidian theme, or the default?",
  key: "useThemeFont",
  control: "toggle"
})



// -- SectionColoring -- //

const SectionColoringHeading = Heading("Coloring")

const ColoringApproach = SettingComponent({
  name: "Coloring approach",
  key: "coloring",
  control: dropdown(
    ["depth", "Depth-based coloring"],
    ["branch", "Branch-based coloring"],
    ["single", "Single color"])
})

const Description = (approach: Coloring) => 
  HtmlComponent(new Setting(createFragment())
    .setClass("mmng-coloring-approach-description")
    .setDesc({
      branch: "In branch mode, colors are chosen at random",
      depth: "In depth mode, branches are colored based on their depth in the mindmap",
      single: "In single color mode, all branches are the same color"
    }[approach])
    .settingEl)

const Color1 = SettingComponent({
  name: "Depth 1 color",
  description: "Color for the first level of the mindmap",
  key: "depth1Color",
  control: "colorPicker"
})

const Color2 = SettingComponent({
  name: "Depth 2 color",
  description: "Color for the second level of the mindmap",
  key: "depth2Color",
  control: "colorPicker"
})

const Color3 = SettingComponent({
  name: "Depth 3 color",
  description: "Color for the third level of the mindmap",
  key: "depth3Color",
  control: "colorPicker"
})

const ColorDefault = SettingComponent({
  name: "Default color",
  description: "Color for fourth level and beyond",
  key: "defaultColor",
  control: "colorPicker"
})

const ColorSingle = SettingComponent({
  name: "Color",
  key: "defaultColor",
  control: "colorPicker"
})

const ColorFreezeLevel = SettingComponent({
  name: "Color freeze level",
  description: "All child branches will use the color of their ancestor node beyond the freeze level",
  key: "colorFreezeLevel",
  control: numberText("Example: 3")
})


const SectionColoringGlobal = (settings: GlobalSettings) => {
  const approach = ColoringApproach.global(settings)
  const branch = [
    Description("branch"),
    ColorFreezeLevel.global(settings),
  ]
  const depth = [
    Description("depth"),
    Color1.global(settings),
    Color2.global(settings),
    Color3.global(settings),
    ColorDefault.global(settings),
  ]
  const single = [
    Description("single"),
    ColorSingle.global(settings),
  ]
  const all = [ ...branch, ...depth, ...single ]

  function setApproach(coloring: Coloring) {
    all.forEach(x => x.node.hidden = true)
    ~{branch, depth, single}[coloring].forEach(x => {
      x.node.hidden = false
      if ("update" in x)
        (x.update as Function)()
    })
  }

  setApproach(settings.coloring)
  approach.onChange(setApproach)

  return fragment([
    SectionColoringHeading(),
    approach,
    ...branch, ...depth, ...single
  ])
}

const SectionColoringHeritable = (inherit: GlobalSettings, partial: Partial<GlobalSettings>) => {
  const approach = ColoringApproach.heritable(inherit, partial)
  const branch = [
    Description("branch"),
    ColorFreezeLevel.heritable(inherit, partial),
  ]
  const depth = [
    Description("depth"),
    Color1.heritable(inherit, partial),
    Color2.heritable(inherit, partial),
    Color3.heritable(inherit, partial),
    ColorDefault.heritable(inherit, partial),
  ]
  const single = [
    Description("single"),
    ColorSingle.heritable(inherit, partial),
  ]
  const all = [ ...branch, ...depth, ...single ]

  function setApproach(coloring: Coloring) {
    all.forEach(x => x.node.hidden = true)
    ~{branch, depth, single}[coloring].forEach(x => {
      x.node.hidden = false
      if ("update" in x) (x.update as Function)()
    })
  }

  setApproach(partial.coloring || inherit.coloring)
  approach.onChange(setApproach)

  return fragment([
    SectionColoringHeading(),
    approach,
    ...branch, ...depth, ...single
  ])
}



// -- SectionThickness -- //

const SectionThicknessHeading = Heading("Line thickness", "Measured in pixels")

const Thickness1 = SettingComponent({
  name: "Depth 1",
  key: "depth1Thickness",
  control: "text"
})

const Thickness2 = SettingComponent({
  name: "Depth 2",
  key: "depth2Thickness",
  control: "text"
})

const Thickness3 = SettingComponent({
  name: "Depth 3",
  key: "depth3Thickness",
  control: "text"
})

const ThicknessDefault = SettingComponent({
  name: "Default",
  key: "defaultThickness",
  control: "text"
})



// -- SectionScreenshots -- //

const SectionScreenshotsHeading = Heading("Screenshots", "Choose how you want your screenshots to look")

const ScreenshotTextColor = (settings: Pick<GlobalSettings, "screenshotTextColor" | "screenshotTextColorEnabled">) =>
  HtmlComponent(new Setting(createFragment())
    .setName("Screenshot text color")
    .setDesc("Text color for the screenshot. Toggle the switch on and off to disable/enable this color on the screenshot")
    .addColorPicker(colPicker => colPicker
      .setValue(settings.screenshotTextColor)
      .onChange(value =>
        settings.screenshotTextColor = value ))
    .addToggle(toggle => toggle
      .setValue(settings.screenshotTextColorEnabled)
      .onChange(value =>
        settings.screenshotTextColorEnabled = value ))
    .settingEl
  )

const ScreenshotBackgroundStyle = (settings: Pick<GlobalSettings, "screenshotBgStyle" | "screenshotBgColor">) =>
  HtmlComponent(new Setting(createFragment())
    .setName("Screenshot background style")
    .setDesc(`Select the background style for the screenshot, when using "Color" the color picker value will be used`)
    .addDropdown(dropdown => dropdown
      .addOptions({
        [ScreenshotBgStyle.Transparent]: "Transparent",
        [ScreenshotBgStyle.Color]: "Color",
        [ScreenshotBgStyle.Theme]: "Theme",
      })
      .setValue(settings.screenshotBgStyle)
      .onChange((value: ScreenshotBgStyle) =>
        settings.screenshotBgStyle = value ))
    .addColorPicker(colPicker => colPicker
      .setValue(settings.screenshotBgColor)
      .onChange(value =>
        settings.screenshotBgColor = value ))
    .settingEl
  )



// -- SectionMarkmap -- //

const SectionMarkmapHeading = Heading("Markmap settings", "Settings for adjusting how Markmap draws the mindmaps")

const NodeMinHeight = SettingComponent({
  name: "Node Min Height",
  description: "Minimum height for the mindmap nodes",
  key: "nodeMinHeight",
  control: numberText("Example: 16")
})

const NodeTextLineHeight = SettingComponent({
  name: "Node Text Line Height",
  description: "Line height for content in mindmap nodes",
  key: "lineHeight",
  control: text("Example: 1em")
})

const VerticalSpacing = SettingComponent({
  name: "Vertical Spacing",
  description: "Vertical spacing of the mindmap nodes",
  key: "spacingVertical",
  control: numberText("Example: 5")
})

const HorizontalSpacing = SettingComponent({
  name: "Horizontal Spacing",
  description: "Horizontal spacing of the mindmap nodes",
  key: "spacingHorizontal",
  control: numberText("Example: 80")
})

const HorizontalPadding = SettingComponent({
  name: "Horizontal padding",
  description: "Leading space before the content of mindmap nodes",
  key: "paddingX",
  control: numberText("Example: 8")
})

const InitialExpandLevel = SettingComponent({
  name: "Initial expand level",
  description: "Sets the initial depth of the mindmap. 0 means all nodes are collapsed, "
             + "1 means only the root node is expanded, etc. To expand all nodes, set this to -1",
  key: "initialExpandLevel",
  control: numberText("Example: 2")
})

const AnimationDuration = SettingComponent({
  name: "Animation duration",
  description: "The animation duration when folding/unfolding a node",
  key: "animationDuration",
  control: numberText("Example: 500")
})

const MaxWidth = SettingComponent({
  name: "Max width",
  description: "The max width of each node. 0 for no limit",
  key: "maxWidth",
  control: numberText("Example: 130")
})



// -- Complete Pages -- //

const GlobalPage = (settings: GlobalSettings) => () => {
  return fragment([
    fragment([
      SplitDirection.global(settings),
      HighlightInlineMindmap.global(settings),
      TitleAsRootNode.global(settings),
      UseThemeFont.global(settings),
    ]),
    SectionColoringGlobal(settings),
    fragment([
      SectionThicknessHeading(),
      Thickness1.global(settings),
      Thickness2.global(settings),
      Thickness3.global(settings),
      ThicknessDefault.global(settings),
    ]),
    fragment([
      SectionScreenshotsHeading(),
      ScreenshotTextColor(settings),
      ScreenshotBackgroundStyle(settings),
    ]),
    fragment([
      SectionMarkmapHeading(),
      NodeMinHeight.global(settings),
      NodeTextLineHeight.global(settings),
      VerticalSpacing.global(settings),
      HorizontalSpacing.global(settings),
      HorizontalPadding.global(settings),
      InitialExpandLevel.global(settings),
      AnimationDuration.global(settings),
      MaxWidth.global(settings),
    ])
  ])
}

const FilePage = (global: GlobalSettings, file: Partial<FileSettings>) => () =>
  fragment([
    fragment([
      HighlightInlineMindmap.heritable(global, file),
      TitleAsRootNode.heritable(global, file),
    ]),
    SectionColoringHeritable(global, file),
    fragment([
      SectionThicknessHeading(),
      Thickness1.heritable(global, file),
      Thickness2.heritable(global, file),
      Thickness3.heritable(global, file),
      ThicknessDefault.heritable(global, file),
    ]),
    fragment([
      SectionMarkmapHeading(),
      NodeMinHeight.heritable(global, file),
      NodeTextLineHeight.heritable(global, file),
      VerticalSpacing.heritable(global, file),
      HorizontalSpacing.heritable(global, file),
      HorizontalPadding.heritable(global, file),
      InitialExpandLevel.heritable(global, file),
      AnimationDuration.heritable(global, file),
      MaxWidth.heritable(global, file),
    ])
  ])

const CodeBlockPage = (inherit: GlobalSettings, codeBlock: Partial<CodeBlockSettings>) => () => 
  fragment([
    fragment([
      HighlightInlineMindmap.heritable(inherit, codeBlock)
    ]),
    SectionColoringHeritable(inherit, codeBlock),
    fragment([
      SectionThicknessHeading(),
      Thickness1.heritable(inherit, codeBlock),
      Thickness2.heritable(inherit, codeBlock),
      Thickness3.heritable(inherit, codeBlock),
      ThicknessDefault.heritable(inherit, codeBlock),
    ]),
    fragment([
      SectionMarkmapHeading(),
      NodeMinHeight.heritable(inherit, codeBlock),
      NodeTextLineHeight.heritable(inherit, codeBlock),
      VerticalSpacing.heritable(inherit, codeBlock),
      HorizontalSpacing.heritable(inherit, codeBlock),
      HorizontalPadding.heritable(inherit, codeBlock),
      InitialExpandLevel.heritable(inherit, codeBlock),
      AnimationDuration.heritable(inherit, codeBlock),
      MaxWidth.heritable(inherit, codeBlock),
    ])
  ])

export { GlobalPage, FilePage, CodeBlockPage }
