import { SplitDirection } from "obsidian";
import { ScreenshotBgStyle } from "./@types/screenshot";

export class MindMapSettings {
  splitDirection: SplitDirection = "horizontal";
  nodeMinHeight: number = 16;
  lineHeight: string = "1em";
  spacingVertical: number = 5;
  spacingHorizontal: number = 80;
  paddingX: number = 8;
  color1: string = "#fed766";
  color1Thickness: string = "8";

  color2: string = "#2ab7ca";
  color2Thickness: string = "6";

  color3: string = "#fe4a49";
  color3Thickness: string = "4";

  defaultColor: string = "#000";
  defaultColorThickness: string = "2";

  initialExpandLevel: number = -1;

  onlyUseDefaultColor = false;

  coloring: "depth" | "branch" = "depth";

  colorFreezeLevel: number = 0;
  animationDuration: number = 500;
  maxWidth: number = 0;
  // below a beautiful dark blue color
  screenshotBgColor: string = "#039614";
  screenshotFgColor: string = "#ffffff";
  screenshotFgColorEnabled: boolean = false;
  screenshotBgStyle: ScreenshotBgStyle = ScreenshotBgStyle.Transparent;
  screenshotTransparentBg: boolean = true;
  highlight: boolean = true;
}
