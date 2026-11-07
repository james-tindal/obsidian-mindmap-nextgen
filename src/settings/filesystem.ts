import type { SplitDirection } from 'obsidian'
import { LocalEvents } from 'src/utilities/utilities'
import { Layout } from 'src/views/layout-manager'
import { plugin } from 'src/core/main'
import { Notice } from 'obsidian'
import { captureFolding, FoldingState, moveFoldingStates, parseFoldingStates } from 'src/rendering/folding'
import type { IPureNode } from 'markmap-common'
import { dataWriter } from './data-writer'
import { strings } from 'src/translation'


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
  rememberFolding: false,
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
  rememberFolding: boolean
}

export type v2 = {
  version: '2.0'
  settings: SettingsV2,
  layout: Layout
  foldingStates: Record<string, FoldingState>
}

const useDefaultsForMissingKeys =
(data: any): v2 => ({
  version: '2.0',
  layout: data?.layout || [],
  foldingStates: parseFoldingStates(data?.foldingStates),
  settings: {
    ...defaultSettings,
    ...data?.settings
  }
})

type OmitFromFileSettings =
| 'splitDirection'
| 'rememberFolding'
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
export let foldingStates: {
  load(path: string): FoldingState | undefined
  save(path: string, root: IPureNode): void
  reset(path: string): void
}

plugin.loadData()
.then(useDefaultsForMissingKeys)
.then(fsd => {
  const save = dataWriter<v2>(data => plugin.saveData(data), error => {
    console.error('Mindmap NextGen: could not save plugin data', error)
    new Notice(strings.saveError)
  })
  save(fsd)

  globalSettings = new Proxy<GlobalSettings>(fsd.settings, {
    get: (_, key: keyof GlobalSettings) => fsd.settings[key],
    set<K extends keyof GlobalSettings>(_: any, key: K, value: GlobalSettings[K]) {
      fsd.settings[key] = value
      events.emit(key, value)
      save(fsd)
      return true
    }
  })

  layout = {
    save(layout: Layout) {
      fsd.layout = layout
      save(fsd)
    },
    load: () => fsd.layout
  }

  foldingStates = {
    load: path => Object.prototype.hasOwnProperty.call(fsd.foldingStates, path) ? fsd.foldingStates[path] : undefined,
    save(path, root) {
      fsd.foldingStates[path] = captureFolding(root)
      save(fsd)
    },
    reset(path) {
      delete fsd.foldingStates[path]
      save(fsd)
    }
  }
  plugin.registerEvent(app.vault.on('rename', (file, oldPath) => {
    if (moveFoldingStates(fsd.foldingStates, oldPath, file.path)) save(fsd)
  }))
  plugin.registerEvent(app.vault.on('delete', file => {
    if (moveFoldingStates(fsd.foldingStates, file.path)) save(fsd)
  }))

  resolve(globalSettings)
})
