type SplitDirection = import("obsidian").SplitDirection;

type ScreenshotBgStyle = import("./screenshot").ScreenshotBgStyle;

type MindMapSettings = {
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

  onlyUseDefaultColor: boolean;

  coloring: "depth" | "branch";

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
