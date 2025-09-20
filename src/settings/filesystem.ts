import type { SplitDirection } from 'obsidian'
import { LocalEvents } from 'src/utilities/utilities'
import { Layout } from 'src/views/layout-manager'
import { plugin } from 'src/core/entry'


export type Coloring = 'depth' | 'branch' | 'single'
export enum ScreenshotBgStyle {
  Transparent = 'transparent',
  Color = 'color',
  Theme = 'theme',
}

// Default settings
export const defaultSettings: v2['settings'] = {
  splitDirection: 'horizontal',
  nodeMinHeight: 16,
  lineHeight: '1em',
  spacingVertical: 5,
  spacingHorizontal: 80,
  paddingX: 8,
  initialExpandLevel: -1,
  colorFreezeLevel: 0,
  animationDuration: 500,
  maxWidth: 0,
  highlight: true,

  coloring: 'depth',
  depth1Color: '#cb4b16',
  depth1Thickness: '3',
  depth2Color: '#6c71c4',
  depth2Thickness: '1.5',
  depth3Color: '#859900',
  depth3Thickness: '1',
  defaultColor: '#b58900',
  defaultThickness: '1',

  screenshotBgColor: '#002b36',
  screenshotBgStyle: ScreenshotBgStyle.Color,
  screenshotTextColor: '#fdf6e3',
  screenshotTextColorEnabled: false,
  titleAsRootNode: true,
}

type SettingsV2 = {
  splitDirection: SplitDirection
  nodeMinHeight: number
  lineHeight: string
  spacingVertical: number
  spacingHorizontal: number
  paddingX: number
  initialExpandLevel: number
  defaultColor: string
  colorFreezeLevel: number
  animationDuration: number
  maxWidth: number
  highlight: boolean
  screenshotBgColor: string
  screenshotBgStyle: ScreenshotBgStyle

  depth1Color: string
  depth1Thickness: string
  depth2Color: string
  depth2Thickness: string
  depth3Color: string
  depth3Thickness: string
  defaultThickness: string
  screenshotTextColor: string
  screenshotTextColorEnabled: boolean

  coloring: Coloring
  titleAsRootNode: boolean
}

export type v2 = {
  version: '2.0'
  settings: SettingsV2,
  layout: Layout
}

const useDefaultsForMissingKeys =
(data: any): v2 => ({
  version: '2.0',
  layout: data?.layout || [],
  settings: {
    ...defaultSettings,
    ...data?.settings
  }
})

type OmitFromFileSettings =
| 'splitDirection'
| 'screenshotTextColor'
| 'screenshotTextColorEnabled'
| 'screenshotBgStyle'
| 'screenshotBgColor'

export type GlobalSettings = v2['settings']
export type FileSettings = Omit<GlobalSettings, OmitFromFileSettings> & { color?: string[] }
export type CodeBlockSettings = Omit<FileSettings, 'titleAsRootNode'> & { height?: number }

const { resolve, promise: settingsLoaded } = Promise.withResolvers<GlobalSettings>()
export { settingsLoaded }

const events = new LocalEvents<keyof GlobalSettings>()
export const settingChanges = { listen: events.listen }

export let globalSettings: GlobalSettings
export let layout: {
  save(layout: Layout): void
  load(): Layout
}

plugin.loadData()
.then(useDefaultsForMissingKeys)
.then(fsd => {
  plugin.saveData(fsd)

  globalSettings = new Proxy<GlobalSettings>(fsd.settings, {
    get: (_, key: keyof GlobalSettings) => fsd.settings[key],
    set<K extends keyof GlobalSettings>(_: any, key: K, value: GlobalSettings[K]) {
      fsd.settings[key] = value
      events.emit(key, value)
      plugin.saveData(fsd)
      return true
    }
  })

  layout = {
    save(layout: Layout) {
      fsd.layout = layout
      plugin.saveData(fsd)
    },
    load: () => fsd.layout
  }

  resolve(globalSettings)
})
