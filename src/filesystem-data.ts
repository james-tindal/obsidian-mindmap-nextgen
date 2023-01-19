import type { Plugin_2, SplitDirection } from "obsidian";

export enum ScreenshotBgStyle {
  Transparent = "transparent",
  Color = "color",
  Theme = "theme",
}

/**
 * Given a version number MAJOR.MINOR, increment the:
 * 1. MAJOR version when previously valid keys are removed or have a different function
 * 2. MINOR version when only new keys have been added
 */

const omit = <T, U extends keyof T>(keys: readonly U[], obj: T): Omit<T, U> =>
  (Object.keys(obj) as U[]).reduce(
    (acc, curr) => (keys.includes(curr) ? acc : { ...acc, [curr]: obj[curr] }),
    {} as Omit<T, U>
  );

function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  const ret: any = {};
  keys.forEach(key => {
    ret[key] = obj[key];
  })
  return ret;
}


// Default settings
export const defaults: v2_0['settings'] = {
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
  screenshotBgStyle: ScreenshotBgStyle.Transparent,
  screenshotTextColor: "#fdf6e3",
  screenshotTextColorEnabled: false
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
const upgrade1_1 = (data: v1_0): v1_1 => {
  const unchanged = {
    splitDirection:        data.splitDirection,
    nodeMinHeight:         data.nodeMinHeight,
    lineHeight:            data.lineHeight,
    spacingVertical:       data.spacingVertical,
    spacingHorizontal:     data.spacingHorizontal,
    paddingX:              data.paddingX,
    initialExpandLevel:    data.initialExpandLevel,
    color1:                data.color1,
    color1Thickness:       data.color1Thickness,
    color2:                data.color2,
    color2Thickness:       data.color2Thickness,
    color3:                data.color3,
    color3Thickness:       data.color3Thickness,
    defaultColor:          data.defaultColor,
    defaultColorThickness: data.defaultColorThickness,
    onlyUseDefaultColor:   data.onlyUseDefaultColor,
  }

  const added = {
    coloring:                 "depth" as v1_1['coloring'],
    colorFreezeLevel:         defaults.colorFreezeLevel,
    animationDuration:        defaults.animationDuration,
    maxWidth:                 defaults.maxWidth,
    highlight:                defaults.highlight,
    screenshotBgColor:        defaults.screenshotBgColor,
    screenshotBgStyle:        defaults.screenshotBgStyle,
    screenshotTransparentBg:  false,
    screenshotFgColor:        defaults.screenshotTextColor,
    screenshotFgColorEnabled: defaults.screenshotTextColorEnabled,
  }

  return {
    ...unchanged,
    ...added
  }
}


//  Version 2.0

export type Coloring = "depth" | "branch" | "single"

type Settings2_0 = {
  splitDirection: SplitDirection,
  nodeMinHeight: number,
  lineHeight: string,
  spacingVertical: number,
  spacingHorizontal: number,
  paddingX: number,
  initialExpandLevel: number,
  defaultColor: string,
  colorFreezeLevel: number,
  animationDuration: number,
  maxWidth: number,
  highlight: boolean,
  screenshotBgColor: string,
  screenshotBgStyle: ScreenshotBgStyle,

  depth1Color: string,
  depth1Thickness: string,
  depth2Color: string,
  depth2Thickness: string,
  depth3Color: string,
  depth3Thickness: string,
  defaultThickness: string,
  screenshotTextColor: string,
  screenshotTextColorEnabled: boolean,

  coloring: Coloring
}

export type v2_0 = {
  version: "2.0",
  settings: Settings2_0
}

const upgrade2_0 = (data: v1_1): v2_0 => {
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
    version: '2.0',
    settings: {
      ...unchanged,
      ...renamed,
      ...transformed
    }
  }
}

const defaults2_0 = (): v2_0 => ({
  version: '2.0',
  settings: defaults
})

export type PluginSettings = v2_0["settings"];
type FileSystemData = v2_0;
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
  ""   : defaults2_0,
}

function upgrade(data: any): FileSystemData {
  let accumulator = data;
  let version;
  for (;;) {
    version = detectVersion(accumulator);
    if (version !== latestVersion)
      accumulator = upgrades[version](accumulator)
    else
      return accumulator;
  }
}

type SettingsManager = {
  get: <K extends keyof PluginSettings>(key: K) => PluginSettings[K]
  set: <K extends keyof PluginSettings>(key: K, value: PluginSettings[K]) => void
  pick: <K extends keyof PluginSettings>(...keys: K[]) => Pick<PluginSettings, K>
  omit: <K extends keyof PluginSettings>(...keys: K[]) => Omit<PluginSettings, K>
  getAll: () => PluginSettings // avoid
}

export async function FileSystemManager (
  loadData: Plugin_2['loadData'],
  saveData: Plugin_2['saveData']
): Promise<[SettingsManager]>
{
  const d = await loadData();
  const fsd: FileSystemData = upgrade(d);
  saveData(fsd);

  const settings: SettingsManager = {
    get: key => fsd.settings[key],
    set(key, value) {
      fsd.settings[key] = value;
      saveData(fsd);
    },
    pick: (...keys) => pick(fsd.settings, ...keys),
    omit: (...keys) => omit(keys, fsd.settings),
    getAll: () => fsd.settings
  }
  return [settings];
}

export type { SettingsManager }
