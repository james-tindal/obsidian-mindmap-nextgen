import { SplitDirection } from "obsidian";

export class MindMapSettings {
  splitDirection: SplitDirection = "horizontal";
  nodeMinHeight: number = 16;
  lineHeight: string = "1em";
  spacingVertical: number = 5;
  spacingHorizontal: number = 80;
  paddingX: number = 8;
  color1: string = "#fed766";
  color2: string = "#2ab7ca";
  color3: string = "#fe4a49";
  defaultColor: string = "#2ab7ca";
  initialExpandLevel: number = 1;
}
