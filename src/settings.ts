import { SplitDirection } from "obsidian";

export class MindMapSettings {
  splitDirection: SplitDirection = "horizontal";
  nodeMinHeight: number = 16;
  lineHeight: string = "1em";
  spacingVertical: number = 5;
  spacingHorizontal: number = 80;
  paddingX: number = 8;
  color1: string = "#fed766";
  color1Thickness: string = '8';

  color2: string = "#2ab7ca";
  color2Thickness: string = '6';

  color3: string = "#fe4a49";
  color3Thickness: string = '4';

  defaultColor: string = "#000";
  defaultColorThickness: string = '2';

  initialExpandLevel: number = 1;

  onlyUseDefaultColor = false;
}
