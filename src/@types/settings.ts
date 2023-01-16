export type SplitDirection = import("obsidian").SplitDirection;

export enum ScreenshotBgStyle {
  Transparent = "transparent",
  Color = "color",
  Theme = "theme",
}

export type MindMapSettings = {
  splitDirection: SplitDirection;
  nodeMinHeight: number;
  lineHeight: string;
  spacingVertical: number;
  spacingHorizontal: number;
  paddingX: number;

  depth1Color: string;
  depth1Thickness: string;

  depth2Color: string;
  depth2Thickness: string;

  depth3Color: string;
  depth3Thickness: string;

  defaultColor: string;
  defaultThickness: string;

  initialExpandLevel: number;

  coloring: "depth" | "branch" | "single";

  colorFreezeLevel: number;
  animationDuration: number;
  maxWidth: number;

  screenshotBgColor: string;
  screenshotTextColor: string;
  screenshotTextColorEnabled: boolean;
  screenshotBgStyle: ScreenshotBgStyle;
  screenshotTransparentBg: boolean;
  highlight: boolean;
};

export const DEFAULT_SETTINGS: MindMapSettings = {
  splitDirection: "horizontal",
  nodeMinHeight: 16,
  lineHeight: "1em",
  spacingVertical: 5,
  spacingHorizontal: 80,
  paddingX: 8,

  depth1Color: "#cb4b16",
  depth1Thickness: "3",

  depth2Color: "#6c71c4",
  depth2Thickness: "1.5",

  depth3Color: "#859900",
  depth3Thickness: "1",

  defaultColor: "#b58900",
  defaultThickness: "1",

  initialExpandLevel: -1,

  coloring: "depth",

  colorFreezeLevel: 0,
  animationDuration: 500,
  maxWidth: 0,
  screenshotBgColor: "#002b36",
  screenshotBgStyle: ScreenshotBgStyle.Transparent,
  screenshotTransparentBg: true,
  screenshotTextColor: "#fdf6e3",
  screenshotTextColorEnabled: false,
  highlight: true,
};
