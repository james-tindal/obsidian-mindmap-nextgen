import obsidian, { Setting } from "obsidian"
import { CodeBlockSettings, Coloring, FileSettings, GlobalSettings, ScreenshotBgStyle } from "./filesystem"



// -- Utilities -- //

type Component<Return = void> = (parent: Node) => Return
type SettingComponent = Component<Setting>

type Level = "global" | "file" | "codeBlock"
type Choice = GlobalSettings | FileSettings | CodeBlockSettings

type Choose<L extends Level> =
  { global: GlobalSettings, file: FileSettings, codeBlock: CodeBlockSettings }[L]

const is = (level: Level) => (...allowedLevels: Level[]) => allowedLevels.includes(level)

type Children<Return = void> = Array<Component<Return> | false | undefined>



const div = (children: Children = [], options: string | DomElementInfo = {}) => (parent: Node) =>
  parent.createDiv(options, div => children.forEach(component => component && component(div)))

const fragment = (children: Children) => (parent: Node) =>
  children.forEach(component => component && component(parent))



type HideableComponent<Return = void> = Component<Return> & {
  hide(): void
  show(): void
}

const HideableComponent = (component: SettingComponent): HideableComponent<Setting> => {
  const fragment = createFragment()
  const setting = component(fragment)

  function hideableComponent(parent: Node) {
    parent.appendChild(fragment)
    return setting
  }
  hideableComponent.hide = () => setting.settingEl.hidden = true
  hideableComponent.show = () => setting.settingEl.hidden = false

  return hideableComponent
}

const HideableFragment = (children: Children<Setting>): HideableComponent => {
  const hideables = children
    .filter((x): x is Component<Setting> => !!x)
    .map(HideableComponent)

  function hideableFragment(parent: Node) {
    hideables.forEach(h => h(parent))
  }
  hideableFragment.hide = () => hideables.forEach(h => h.hide())
  hideableFragment.show = () => hideables.forEach(h => h.show())

  return hideableFragment
}



// -- SectionGeneral -- //

const SplitDirection = (settings: Pick<GlobalSettings, "splitDirection">) => (parent: Node) =>
  new Setting(parent)
    .setName("Split direction")
    .setDesc("Direction to split the window when opening a mindmap")
    .addDropdown((dropDown) => dropDown
      .addOption("horizontal", "Horizontal")
      .addOption("vertical", "Vertical")
      .setValue(settings.splitDirection)
      .onChange((value: obsidian.SplitDirection) =>
        settings.splitDirection = value ))

const HighlightInlineMindmap = (settings: Pick<GlobalSettings, "highlight">) => (parent: Node) =>
  new Setting(parent)
    .setName("Highlight inline mindmap")
    .setDesc("Use a contrasting background color for inline mindmaps")
    .addToggle(toggle => toggle
      .setValue(settings.highlight)
      .onChange(value =>
        settings.highlight = value ))

const TitleAsRootNode = (settings: Pick<GlobalSettings, "titleAsRootNode">) => (parent: Node) =>
  new Setting(parent)
    .setName("Use title as root node")
    .setDesc("When on, the root node of the mindmap will be the title of the document")
    .addToggle(toggle => toggle
      .setValue(settings.titleAsRootNode)
      .onChange(value =>
        settings.titleAsRootNode = value ))

const UseThemeFont = (settings: Pick<GlobalSettings, "useThemeFont">) => (parent: Node) =>
  new Setting(parent)
    .setName("Use theme font")
    .setDesc("Should mindmaps use the same font as your Obsidian theme, or the default?")
    .addToggle(toggle => toggle
      .setValue(settings.useThemeFont)
      .onChange(value =>
        settings.useThemeFont = value ))

const SectionGeneral = <L extends Level, Settings extends Choose<L>>(level: L, settings: Settings) =>
  fragment([
    is(level)("global") &&
      SplitDirection(settings as any),
    HighlightInlineMindmap(settings),
    is(level)("global", "file") &&
      TitleAsRootNode(settings as any),
    is(level)("global") &&
      UseThemeFont(settings as any),
  ])



// -- SectionColoring -- //

const SectionColoringHeading = (parent: Node) =>
  new Setting(parent)
    .setHeading()
    .setName("Coloring")

const ColoringApproach = (settings: Pick<GlobalSettings, "coloring">, render: () => void) => (parent: Node) =>
  new Setting(parent)
    .setName("Coloring approach")
    .addDropdown(dropDown => dropDown
      .addOption("depth", "Depth-based coloring")
      .addOption("branch", "Branch-based coloring")
      .addOption("single", "Single color")
      .setValue(settings.coloring)
      .onChange((value: Coloring) => {
        settings.coloring = value
        render()
      }))

const Description = (approach: Coloring) => (parent: Node) =>
  new Setting(parent)
    .setClass("mmng-coloring-approach-description")
    .setDesc({
      branch: "In branch mode, colors are chosen at random",
      depth: "In depth mode, branches are colored based on their depth in the mindmap",
      single: "In single color mode, all branches are the same color"
    }[approach])

const Color1 = (settings: Pick<GlobalSettings, "depth1Color">) => (parent: Node) =>
  new Setting(parent)
    .setName("Depth 1 color")
    .setDesc("Color for the first level of the mindmap")
    .addColorPicker(colPicker => colPicker
      .setValue(settings.depth1Color)
      .onChange(value =>
        settings.depth1Color = value ))

const Color2 = (settings: Pick<GlobalSettings, "depth2Color">) => (parent: Node) =>
  new Setting(parent)
    .setName("Depth 2 color")
    .setDesc("Color for the second level of the mindmap")
    .addColorPicker(colPicker => colPicker
      .setValue(settings.depth2Color)
      .onChange(value =>
        settings.depth2Color = value ))


const Color3 = (settings: Pick<GlobalSettings, "depth3Color">) => (parent: Node) =>
  new Setting(parent)
    .setName("Depth 3 color")
    .setDesc("Color for the third level of the mindmap")
    .addColorPicker(colPicker => colPicker
      .setValue(settings.depth3Color)
      .onChange(value =>
        settings.depth3Color = value ))

const ColorDefault = (settings: Pick<GlobalSettings, "defaultColor">) => (parent: Node) =>
  new Setting(parent)
    .setName("Default color")
    .setDesc("Color for fourth level and beyond")
    .addColorPicker(colPicker => colPicker
      .setValue(settings.defaultColor)
      .onChange(value =>
        settings.defaultColor = value ))

const ColorSingle = (settings: Pick<GlobalSettings, "defaultColor">) => (parent: Node) =>
  new Setting(parent)
    .setName("Color")
    .addColorPicker(colPicker => colPicker
      .setValue(settings.defaultColor)
      .onChange(value =>
        settings.defaultColor = value ))

const ColorFreezeLevel = (settings: Pick<GlobalSettings, "colorFreezeLevel">) => (parent: Node) =>
  new Setting(parent)
    .setName("Color freeze level")
    .setDesc("All child branches will use the color of their ancestor node beyond the freeze level")
    .addText((text) => text
      .setValue(settings.colorFreezeLevel.toString())
      .setPlaceholder("Example: 3")
      .onChange(value =>
        settings.colorFreezeLevel = Number.parseInt(value) ))

const SectionColoring = (settings: Choice) => {
  const branch = HideableFragment([
    Description("branch"),
    ColorFreezeLevel(settings),
  ])
  const depth = HideableFragment([
    Description("depth"),
    Color1(settings),
    Color2(settings),
    Color3(settings),
    ColorDefault(settings),
  ])
  const single = HideableFragment([
    Description("single"),
    ColorSingle(settings),
  ])

  function render() {
    ~[branch, depth, single].forEach(x => x.hide())
    ~{branch, depth, single}[settings.coloring].show()
  }

  render()

  return fragment([
    SectionColoringHeading,
    ColoringApproach(settings, render),
    branch, depth, single
  ])
}



// -- SectionThickness -- //

const SectionThicknessHeading = (parent: Node) =>
  new Setting(parent)
    .setHeading()
    .setName("Line thickness")
    .setDesc("Measured in pixels")

const Depth1 = (settings: Pick<GlobalSettings, "depth1Thickness">) => (parent: Node) =>
  new Setting(parent)
    .setName("Depth 1")
    .addText(slider => slider
      .setValue(settings.depth1Thickness)
      .onChange(value =>
        settings.depth1Thickness = value ))

const Depth2 = (settings: Pick<GlobalSettings, "depth2Thickness">) => (parent: Node) =>
  new Setting(parent)
    .setName("Depth 2")
    .addText(slider => slider
      .setValue(settings.depth2Thickness)
      .onChange(value =>
        settings.depth2Thickness = value ))

const Depth3 = (settings: Pick<GlobalSettings, "depth3Thickness">) => (parent: Node) =>
  new Setting(parent)
    .setName("Depth 3")
    .addText(slider => slider
      .setValue(settings.depth3Thickness)
      .onChange(value =>
        settings.depth3Thickness = value ))

const DepthDefault = (settings: Pick<GlobalSettings, "defaultThickness">) => (parent: Node) =>
  new Setting(parent)
    .setName("Default")
    .setDesc("Thickness for levels deeper than three")
    .addText((slider) => slider
      .setValue(settings.defaultThickness)
      .onChange((value) =>
        settings.defaultThickness = value ))

const SectionThickness = (settings: Choice) =>
  fragment([
    SectionThicknessHeading,
    Depth1(settings),
    Depth2(settings),
    Depth3(settings),
    DepthDefault(settings),
  ])



// -- SectionScreenshots -- //

const SectionScreenshotsHeading = (parent: Node) =>
  new Setting(parent)
    .setHeading()
    .setName("Screenshots")
    .setDesc("Choose how you want your screenshots to look")

const ScreenshotTextColor = (settings: Pick<GlobalSettings, "screenshotTextColor" | "screenshotTextColorEnabled">) => (parent: Node) =>
  new Setting(parent)
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

const ScreenshotBackgroundStyle = (settings: Pick<GlobalSettings, "screenshotBgStyle" | "screenshotBgColor">) => (parent: Node) =>
  new Setting(parent)
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


const SectionScreenshots = (settings: GlobalSettings) =>
  fragment([
    SectionScreenshotsHeading,
    ScreenshotTextColor(settings),
    ScreenshotBackgroundStyle(settings),
  ])



// -- SectionMarkmap -- //

const SectionMarkmapHeading = (parent: Node) =>
  new Setting(parent)
    .setHeading()
    .setName("Markmap settings")
    .setDesc("Settings for adjusting how Markmap draws the mindmaps")

const NodeMinHeight = (settings: Pick<GlobalSettings, "nodeMinHeight">) => (parent: Node) =>
  new Setting(parent)
    .setName("Node Min Height")
    .setDesc("Minimum height for the mindmap nodes")
    .addText(text => text
      .setValue(settings.nodeMinHeight.toString())
      .setPlaceholder("Example: 16")
      .onChange(value =>
        settings.nodeMinHeight = Number.parseInt(value) ))

const NodeTextLineHeight = (settings: Pick<GlobalSettings, "lineHeight">) => (parent: Node) =>
  new Setting(parent)
    .setName("Node Text Line Height")
    .setDesc("Line height for content in mindmap nodes")
    .addText(text => text
      .setValue(settings.lineHeight)
      .setPlaceholder("Example: 1em")
      .onChange(value =>
        settings.lineHeight = value ))

const VerticalSpacing = (settings: Pick<GlobalSettings, "spacingVertical">) => (parent: Node) =>
  new Setting(parent)
    .setName("Vertical Spacing")
    .setDesc("Vertical spacing of the mindmap nodes")
    .addText(text => text
      .setValue(settings.spacingVertical.toString())
      .setPlaceholder("Example: 5")
      .onChange(value =>
        settings.spacingVertical = Number.parseInt(value) ))

const HorizontalSpacing = (settings: Pick<GlobalSettings, "spacingHorizontal">) => (parent: Node) =>
  new Setting(parent)
    .setName("Horizontal Spacing")
    .setDesc("Horizontal spacing of the mindmap nodes")
    .addText(text => text
      .setValue(settings.spacingHorizontal.toString())
      .setPlaceholder("Example: 80")
      .onChange(value =>
        settings.spacingHorizontal = Number.parseInt(value) ))

const HorizontalPadding = (settings: Pick<GlobalSettings, "paddingX">) => (parent: Node) =>
  new Setting(parent)
    .setName("Horizontal padding")
    .setDesc("Leading space before the content of mindmap nodes")
    .addText(text => text
      .setValue(settings.paddingX.toString())
      .setPlaceholder("Example: 8")
      .onChange(value =>
        settings.paddingX = Number.parseInt(value) ))

const InitialExpandLevel = (settings: Pick<GlobalSettings, "initialExpandLevel">) => (parent: Node) =>
  new Setting(parent)
    .setName("Initial expand level")
    .setDesc("Sets the initial depth of the mindmap. 0 means all nodes are collapsed, "
           + "1 means only the root node is expanded, etc. To expand all nodes, set this to -1" )
    .addText(text => text
      .setValue(settings.initialExpandLevel.toString())
      .setPlaceholder("Example: 2")
      .onChange(value =>
        settings.initialExpandLevel = Number.parseInt(value) ))

const AnimationDuration = (settings: Pick<GlobalSettings, "animationDuration">) => (parent: Node) =>
  new Setting(parent)
    .setName("Animation duration")
    .setDesc("The animation duration when folding/unfolding a node")
    .addText(text => text
      .setValue(settings.animationDuration.toString())
      .setPlaceholder("Example: 500")
      .onChange(value =>
        settings.animationDuration = Number.parseInt(value) ))

const MaxWidth = (settings: Pick<GlobalSettings, "maxWidth">) => (parent: Node) =>
  new Setting(parent)
    .setName("Max width")
    .setDesc("The max width of each node. 0 for no limit")
    .addText(text => text
      .setValue(settings.maxWidth.toString())
      .setPlaceholder("Example: 130")
      .onChange(value =>
        settings.maxWidth = Number.parseInt(value) ))

const SectionMarkmap = (settings: Choice) =>
  fragment([
    SectionMarkmapHeading,
    NodeMinHeight(settings),
    NodeTextLineHeight(settings),
    VerticalSpacing(settings),
    HorizontalSpacing(settings),
    HorizontalPadding(settings),
    InitialExpandLevel(settings),
    AnimationDuration(settings),
    MaxWidth(settings),
  ])



// -- Complete Dialog -- //

const Dialog = <L extends Level, Settings extends Choose<L>>(level: L, settings: Settings) =>
  fragment([
    SectionGeneral(level, settings),
    SectionColoring(settings),
    SectionThickness(settings),
    is(level)("global") &&
      SectionScreenshots(settings as GlobalSettings),
    SectionMarkmap(settings),
  ])

export { Dialog }
