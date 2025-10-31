import { Setting } from 'obsidian'
import { CodeBlockSettings, Coloring, FileSettings, globalSettings, GlobalSettings, ScreenshotBgStyle } from 'src/settings/filesystem'
import { Heading, HtmlComponent, fragment } from './various'
import { SettingComponent, dropdown, numberText, text } from './SettingComponent'
import { strings } from 'src/translation'



// -- SectionGeneral -- //

const SplitDirection = SettingComponent({
  name: strings.settings.settings.splitDirection.name,
  description: strings.settings.settings.splitDirection.description,
  key: 'splitDirection',
  control: dropdown(
    ['horizontal', strings.settings.settings.splitDirection.horizontal],
    ['vertical', strings.settings.settings.splitDirection.vertical])
})

const HighlightInlineMindmap = SettingComponent({
  name: strings.settings.settings.highlight.name,
  description: strings.settings.settings.highlight.description,
  key: 'highlight',
  control: 'toggle'
})

const TitleAsRootNode = SettingComponent({
  name: strings.settings.settings.titleAsRootNode.name,
  description: strings.settings.settings.titleAsRootNode.description,
  key: 'titleAsRootNode',
  control: 'toggle'
})



// -- SectionColoring -- //

const SectionColoringHeading = Heading(strings.settings.sectionHeadings.coloring)

const ColoringApproach = SettingComponent({
  name: strings.settings.settings.coloring.name,
  key: 'coloring',
  control: dropdown(
    ['depth', strings.settings.settings.coloring.depth],
    ['branch', strings.settings.settings.coloring.branch],
    ['single', strings.settings.settings.coloring.single])
})

const Description = (approach: Coloring) => 
  HtmlComponent(new Setting(createFragment())
    .setClass('mmng-coloring-approach-description')
    .setDesc(strings.settings.settings.coloring.description[approach])
    .settingEl)

const Color1 = SettingComponent({
  name: strings.settings.settings.depth1Color.name,
  description: strings.settings.settings.depth1Color.description,
  key: 'depth1Color',
  control: 'colorPicker'
})

const Color2 = SettingComponent({
  name: strings.settings.settings.depth2Color.name,
  description: strings.settings.settings.depth2Color.description,
  key: 'depth2Color',
  control: 'colorPicker'
})

const Color3 = SettingComponent({
  name: strings.settings.settings.depth3Color.name,
  description: strings.settings.settings.depth3Color.description,
  key: 'depth3Color',
  control: 'colorPicker'
})

const ColorDefault = SettingComponent({
  name: strings.settings.settings.defaultColor.name,
  description: strings.settings.settings.defaultColor.description,
  key: 'defaultColor',
  control: 'colorPicker'
})

const ColorSingle = SettingComponent({
  name: strings.settings.settings.defaultColor.singleName,
  key: 'defaultColor',
  control: 'colorPicker'
})

const ColorFreezeLevel = SettingComponent({
  name: strings.settings.settings.colorFreezeLevel.name,
  description: strings.settings.settings.colorFreezeLevel.description,
  key: 'colorFreezeLevel',
  control: numberText(strings.settings.settings.colorFreezeLevel.placeholder)
})


const SectionColoringGlobal = () => {
  const approach = ColoringApproach.global()
  const branch = [
    Description('branch'),
    ColorFreezeLevel.global(),
  ]
  const depth = [
    Description('depth'),
    Color1.global(),
    Color2.global(),
    Color3.global(),
    ColorDefault.global(),
  ]
  const single = [
    Description('single'),
    ColorSingle.global(),
  ]
  const all = [ ...branch, ...depth, ...single ]

  function setApproach(coloring: Coloring) {
    all.forEach(x => x.node.hidden = true)
    for (const component of { branch, depth, single }[coloring]) {
      component.node.hidden = false
      if ('update' in component)
        (component.update as Function)()
    }
  }

  setApproach(globalSettings.coloring)
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
    Description('branch'),
    ColorFreezeLevel.heritable(inherit, partial),
  ]
  const depth = [
    Description('depth'),
    Color1.heritable(inherit, partial),
    Color2.heritable(inherit, partial),
    Color3.heritable(inherit, partial),
    ColorDefault.heritable(inherit, partial),
  ]
  const single = [
    Description('single'),
    ColorSingle.heritable(inherit, partial),
  ]
  const all = [ ...branch, ...depth, ...single ]

  function setApproach(coloring: Coloring) {
    all.forEach(x => x.node.hidden = true)
    ~{branch, depth, single}[coloring].forEach(x => {
      x.node.hidden = false
      if ('update' in x) (x.update as Function)()
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

const SectionThicknessHeading = Heading(
  strings.settings.sectionHeadings.thickness.heading,
  strings.settings.sectionHeadings.thickness.subHeading,
)

const Thickness1 = SettingComponent({
  name: strings.settings.settings.depth1Thickness,
  key: 'depth1Thickness',
  control: 'text'
})

const Thickness2 = SettingComponent({
  name: strings.settings.settings.depth2Thickness,
  key: 'depth2Thickness',
  control: 'text'
})

const Thickness3 = SettingComponent({
  name: strings.settings.settings.depth3Thickness,
  key: 'depth3Thickness',
  control: 'text'
})

const ThicknessDefault = SettingComponent({
  name: strings.settings.settings.defaultThickness,
  key: 'defaultThickness',
  control: 'text'
})



// -- SectionScreenshots -- //

const SectionScreenshotsHeading = Heading(
  strings.settings.sectionHeadings.screenshots.heading,
  strings.settings.sectionHeadings.screenshots.subHeading,
)

const ScreenshotTextColor = (settings: Pick<GlobalSettings, 'screenshotTextColor' | 'screenshotTextColorEnabled'>) =>
  HtmlComponent(new Setting(createFragment())
    .setName(strings.settings.settings.screenshotTextColor.name)
    .setDesc(strings.settings.settings.screenshotTextColor.description)
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

const ScreenshotBackgroundStyle = (settings: Pick<GlobalSettings, 'screenshotBgStyle' | 'screenshotBgColor'>) =>
  HtmlComponent(new Setting(createFragment())
    .setName(strings.settings.settings.screenshotBgStyle.name)
    .setDesc(strings.settings.settings.screenshotBgStyle.description)
    .addDropdown<ScreenshotBgStyle>(dropdown => dropdown
      .addOptions({
        [ScreenshotBgStyle.Transparent]: strings.settings.settings.screenshotBgStyle.transparent,
        [ScreenshotBgStyle.Color]: strings.settings.settings.screenshotBgStyle.color,
        [ScreenshotBgStyle.Theme]: strings.settings.settings.screenshotBgStyle.theme,
      })
      .setValue(settings.screenshotBgStyle)
      .onChange(value =>
        settings.screenshotBgStyle = value ))
    .addColorPicker(colPicker => colPicker
      .setValue(settings.screenshotBgColor)
      .onChange(value =>
        settings.screenshotBgColor = value ))
    .settingEl
  )

// -- SectionMarkmap -- //

const SectionMarkmapHeading = Heading(
  strings.settings.sectionHeadings.markmap.heading,
  strings.settings.sectionHeadings.markmap.subHeading,
)

const NodeMinHeight = SettingComponent({
  name: strings.settings.settings.nodeMinHeight.name,
  description: strings.settings.settings.nodeMinHeight.description,
  key: 'nodeMinHeight',
  control: numberText(strings.settings.settings.nodeMinHeight.placeholder),
})

const NodeTextLineHeight = SettingComponent({
  name: strings.settings.settings.lineHeight.name,
  description: strings.settings.settings.lineHeight.description,
  key: 'lineHeight',
  control: numberText(strings.settings.settings.lineHeight.placeholder),
})

const VerticalSpacing = SettingComponent({
  name: strings.settings.settings.spacingVertical.name,
  description: strings.settings.settings.spacingVertical.description,
  key: 'spacingVertical',
  control: numberText(strings.settings.settings.spacingVertical.placeholder),
})

const HorizontalSpacing = SettingComponent({
  name: strings.settings.settings.spacingHorizontal.name,
  description: strings.settings.settings.spacingHorizontal.description,
  key: 'spacingHorizontal',
  control: numberText(strings.settings.settings.spacingHorizontal.placeholder),
})

const HorizontalPadding = SettingComponent({
  name: strings.settings.settings.paddingX.name,
  description: strings.settings.settings.paddingX.description,
  key: 'paddingX',
  control: numberText(strings.settings.settings.paddingX.placeholder),
})

const InitialExpandLevel = SettingComponent({
  name: strings.settings.settings.initialExpandLevel.name,
  description: strings.settings.settings.initialExpandLevel.description,
  key: 'initialExpandLevel',
  control: numberText(strings.settings.settings.initialExpandLevel.placeholder),
})

const AnimationDuration = SettingComponent({
  name: strings.settings.settings.animationDuration.name,
  description: strings.settings.settings.animationDuration.description,
  key: 'animationDuration',
  control: numberText(strings.settings.settings.animationDuration.placeholder),
})

const MaxWidth = SettingComponent({
  name: strings.settings.settings.maxWidth.name,
  description: strings.settings.settings.maxWidth.description,
  key: 'maxWidth',
  control: numberText(strings.settings.settings.maxWidth.placeholder),
})



// -- Complete Pages -- //

const GlobalPage = () => fragment([
  fragment([
    SplitDirection.global(),
    HighlightInlineMindmap.global(),
    TitleAsRootNode.global(),
  ]),
  SectionColoringGlobal(),
  fragment([
    SectionThicknessHeading(),
    Thickness1.global(),
    Thickness2.global(),
    Thickness3.global(),
    ThicknessDefault.global(),
  ]),
  fragment([
    SectionScreenshotsHeading(),
    ScreenshotTextColor(globalSettings),
    ScreenshotBackgroundStyle(globalSettings),
  ]),
  fragment([
    SectionMarkmapHeading(),
    NodeMinHeight.global(),
    NodeTextLineHeight.global(),
    VerticalSpacing.global(),
    HorizontalSpacing.global(),
    HorizontalPadding.global(),
    InitialExpandLevel.global(),
    AnimationDuration.global(),
    MaxWidth.global(),
  ])
])

const FilePage = (file: Partial<FileSettings>) => () =>
  fragment([
    fragment([
      HighlightInlineMindmap.heritable(globalSettings, file),
      TitleAsRootNode.heritable(globalSettings, file),
    ]),
    SectionColoringHeritable(globalSettings, file),
    fragment([
      SectionThicknessHeading(),
      Thickness1.heritable(globalSettings, file),
      Thickness2.heritable(globalSettings, file),
      Thickness3.heritable(globalSettings, file),
      ThicknessDefault.heritable(globalSettings, file),
    ]),
    fragment([
      SectionMarkmapHeading(),
      NodeMinHeight.heritable(globalSettings, file),
      NodeTextLineHeight.heritable(globalSettings, file),
      VerticalSpacing.heritable(globalSettings, file),
      HorizontalSpacing.heritable(globalSettings, file),
      HorizontalPadding.heritable(globalSettings, file),
      InitialExpandLevel.heritable(globalSettings, file),
      AnimationDuration.heritable(globalSettings, file),
      MaxWidth.heritable(globalSettings, file),
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
