import type { Plugin_2, SplitDirection } from 'obsidian'
import { LocalEvents, PromiseSubject } from 'src/utilities/utilities'
import { Layout } from 'src/views/layout-manager'
import Callbag from 'src/utilities/callbag'


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
  useThemeFont: false,
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
  useThemeFont: boolean
}

export type v2 = {
  version: '2.0'
  settings: SettingsV2,
  layout: Layout
}

const useDefaultsForMissingKeys =
(data: any): v2 => ({
  version: '2.0',
  layout: data.layout || [],
  settings: {
    ...defaultSettings,
    ...data.settings
  }
})

type OmitFromFileSettings =
| 'splitDirection'
| 'useThemeFont'
| 'screenshotTextColor'
| 'screenshotTextColorEnabled'
| 'screenshotBgStyle'
| 'screenshotBgColor'

export type GlobalSettings = v2['settings']
export type FileSettings = Omit<GlobalSettings, OmitFromFileSettings> & { color?: string[] }
export type CodeBlockSettings = Omit<FileSettings, 'titleAsRootNode'> & { height?: number }

type FileSystemData = v2

const [ resolveSettingsReady, settingsReady ] = PromiseSubject<GlobalSettings>()
export { settingsReady }

const events = new LocalEvents<keyof GlobalSettings>()
export const settingChanges = { listen: events.listen }

export type FilesystemManager = Awaited<ReturnType<typeof FilesystemManager>>
export async function FilesystemManager (
  loadData: Plugin_2['loadData'],
  saveData: Plugin_2['saveData']
) {
  const fsd: FileSystemData = useDefaultsForMissingKeys(await loadData())
  saveData(fsd)

  const settings = new Proxy<GlobalSettings>(fsd.settings, {
    get: (_, key) => fsd.settings[key],
    set<K extends keyof GlobalSettings>(_, key: K, value: GlobalSettings[K]) {
      fsd.settings[key] = value
      events.emit(key, value)
      saveData(fsd)
      return true
    }
  })

  const saveLayout = (layout: Layout) => { fsd.layout = layout; saveData(fsd) }
  const loadLayout = () => fsd.layout

  resolveSettingsReady(settings)

  return {
    settings,
    saveLayout,
    loadLayout
  }
}
