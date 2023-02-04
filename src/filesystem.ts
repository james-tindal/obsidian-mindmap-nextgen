import type { Plugin_2, SplitDirection } from "obsidian";
import { LocalEvents } from "./events"
import { Layout } from "./views/layout-manager"
import type { SettingsTab } from "./settings-tab"

export enum ScreenshotBgStyle {
  Transparent = "transparent",
  Color = "color",
  Theme = "theme",
}

/**
 * Given a version number MAJOR.MINOR, increment the:
 * 1. MAJOR version when previously valid keys are removed or have a different function
 * 2. MINOR version - Deprecated. If you are adding a key, just add it to the type and the defaults.
 */

// Default settings
export const defaults: v2["settings"] = {
  splitDirection: "horizontal",
  nodeMinHeight: 16,
  lineHeight: "1em",
  spacingVertical: 5,
  spacingHorizontal: 80,
  paddingX: 8,
  initialExpandLevel: -1,
  colorFreezeLevel: 0,
  animationDuration: 500,
  maxWidth: 0,
  highlight: true,

  coloring: "depth",
  depth1Color: "#cb4b16",
  depth1Thickness: "3",
  depth2Color: "#6c71c4",
  depth2Thickness: "1.5",
  depth3Color: "#859900",
  depth3Thickness: "1",
  defaultColor: "#b58900",
  defaultThickness: "1",

  screenshotBgColor: "#002b36",
  screenshotBgStyle: ScreenshotBgStyle.Color,
  screenshotTextColor: "#fdf6e3",
  screenshotTextColorEnabled: false,
  titleAsRootNode: true,
  useThemeFont: false,
}

const defaultsV1: v1_1 = {
  splitDirection:     defaults.splitDirection,
  nodeMinHeight:      defaults.nodeMinHeight,
  lineHeight:         defaults.lineHeight,
  spacingVertical:    defaults.spacingVertical,
  spacingHorizontal:  defaults.spacingHorizontal,
  paddingX:           defaults.paddingX,
  initialExpandLevel: defaults.initialExpandLevel,
  defaultColor:       defaults.defaultColor,
  colorFreezeLevel:   defaults.colorFreezeLevel,
  animationDuration:  defaults.animationDuration,
  maxWidth:           defaults.maxWidth,
  highlight:          defaults.highlight,
  screenshotBgColor:  defaults.screenshotBgColor,
  screenshotBgStyle:  defaults.screenshotBgStyle,

  color1:                   defaults.depth1Color,
  color1Thickness:          defaults.depth1Thickness,
  color2:                   defaults.depth2Color,
  color2Thickness:          defaults.depth2Thickness,
  color3:                   defaults.depth3Color,
  color3Thickness:          defaults.depth3Thickness,
  defaultColorThickness:    defaults.defaultThickness,
  screenshotFgColor:        defaults.screenshotTextColor,
  screenshotFgColorEnabled: defaults.screenshotTextColorEnabled,

  coloring: "depth",
  onlyUseDefaultColor: false,
  screenshotTransparentBg: false
}


//  Version 1.0

export type v1_0 = {
  splitDirection: SplitDirection;
  nodeMinHeight: number;
  lineHeight: string;
  spacingVertical: number;
  spacingHorizontal: number;
  paddingX: number;
  initialExpandLevel: number;
  color1: string;
  color1Thickness: string;
  color2: string;
  color2Thickness: string;
  color3: string;
  color3Thickness: string;
  defaultColor: string;
  defaultColorThickness: string;
  onlyUseDefaultColor: boolean;
}

//  Version 1.1

export type v1_1 = v1_0 & {
  coloring: "depth" | "branch";
  colorFreezeLevel: number;
  animationDuration: number;
  maxWidth: number;
  highlight: boolean;
  screenshotBgColor: string;
  screenshotFgColor: string;
  screenshotFgColorEnabled: boolean;
  screenshotBgStyle: ScreenshotBgStyle;
  screenshotTransparentBg: boolean;
}

// Upgrade from v1.0 to v1.1
const upgrade1_1 = (data: v1_0): v1_1 => ({
  ...defaultsV1,
  ...data
})


//  Version 2.0

export type Coloring = "depth" | "branch" | "single"

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
  version: "2.0"
  settings: SettingsV2,
  layout: Layout
}

const upgrade2_0 = (data: v1_1): v2 => {
  const removed = ["onlyUseDefaultColor", "screenshotTransparentBg"];

  const unchanged = {
    splitDirection:     data.splitDirection,
    nodeMinHeight:      data.nodeMinHeight,
    lineHeight:         data.lineHeight,
    spacingVertical:    data.spacingVertical,
    spacingHorizontal:  data.spacingHorizontal,
    paddingX:           data.paddingX,
    initialExpandLevel: data.initialExpandLevel,
    defaultColor:       data.defaultColor,
    colorFreezeLevel:   data.colorFreezeLevel,
    animationDuration:  data.animationDuration,
    maxWidth:           data.maxWidth,
    highlight:          data.highlight,
    screenshotBgColor:  data.screenshotBgColor,
    screenshotBgStyle:  data.screenshotBgStyle
  };

  const renamed = {
    depth1Color:                data.color1,
    depth1Thickness:            data.color1Thickness,
    depth2Color:                data.color2,
    depth2Thickness:            data.color2Thickness,
    depth3Color:                data.color3,
    depth3Thickness:            data.color3Thickness,
    defaultThickness:           data.defaultColorThickness,
    screenshotTextColor:        data.screenshotFgColor,
    screenshotTextColorEnabled: data.screenshotFgColorEnabled,
  };

  const transformed = {
    coloring:
      data.onlyUseDefaultColor ? "single" : data.coloring as Coloring
  };

  return {
    version: "2.0",
    layout: [],
    settings: {
      ...defaults,
      ...unchanged,
      ...renamed,
      ...transformed
    }
  }
}

const defaultsV2 = (): v2 => ({
  version: "2.0",
  layout: [],
  settings: defaults
})

const useDefaultsForMissingKeys =
(data: any): v2 => ({
  version: "2.0",
  layout: data.layout || [],
  settings: {
    ...defaults,
    ...data.settings
  }
})

export type PluginSettings = v2["settings"];
type FileSystemData = v2;
const latestVersion = "2.0";

const isObject = (x: any) => typeof x === "object" && x !== null;

type Version = "" | "1.0" | "1.1" | "2.0";

const detectVersion = (data: any) =>
  !isObject(data)    ? "" :
  "version"  in data ? data.version as Version :
  "coloring" in data ? "1.1" :
  "color1"   in data ? "1.0"
                     : "";

const upgrades = {
  "1.0": upgrade1_1,
  "1.1": upgrade2_0,
  "2.0": useDefaultsForMissingKeys,
  ""   : defaultsV2,
}

function upgrade(data: any): FileSystemData {
  let accumulator = data;
  let version;
  for (;;) {
    version = detectVersion(accumulator);
    if (version !== latestVersion)
      accumulator = upgrades[version](accumulator)
    else
      return upgrades[latestVersion](accumulator);
  }
}

type Set = {
  set: <K extends keyof PluginSettings>(_: any, key: K, value: PluginSettings[K]) => boolean;
}

type Get = {
  get: <K extends keyof PluginSettings>(_: any, key: K) => PluginSettings[K];
}

const events = new LocalEvents<keyof PluginSettings>();
export const settingChanges
 : { listen: typeof events.listen }
 = { listen: events.listen.bind(events) }

export type FilesystemManager = Awaited<ReturnType<typeof FilesystemManager>>;
export async function FilesystemManager (
  loadData: Plugin_2["loadData"],
  saveData: Plugin_2["saveData"]
) {
  const fsd: FileSystemData = upgrade(await loadData());
  saveData(fsd);

  const get: Get = { get: (_, key) => fsd.settings[key] }
  const cantSet: Set = { set: () => false }
  const set: Set = {
    set(_, key, value) {
      fsd.settings[key] = value;
      events.emit(key, value)
      saveData(fsd);
      return true;
    }
  }

  const getterSetter = new Proxy<PluginSettings>(fsd.settings, { ...get, ...set });
  const getter       = new Proxy<PluginSettings>(fsd.settings, { ...get, ...cantSet });

  const saveLayout = (layout: Layout) => { fsd.layout = layout; saveData(fsd) };
  const loadLayout = () => fsd.layout;

  return {
    settings: getter,
    createSettingsTab: (Constructor: typeof SettingsTab) => new Constructor(getterSetter),
    saveLayout,
    loadLayout
  };
}
