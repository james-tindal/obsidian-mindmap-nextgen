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
  color1: string;
  color1Thickness: string;

  color2: string;
  color2Thickness: string;

  color3: string;
  color3Thickness: string;

  defaultColor: string;
  defaultColorThickness: string;

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
  color1: "#fed766",
  color1Thickness: "8",

  color2: "#2ab7ca",
  color2Thickness: "6",

  color3: "#fe4a49",
  color3Thickness: "4",

  defaultColor: "#000",
  defaultColorThickness: "2",

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
