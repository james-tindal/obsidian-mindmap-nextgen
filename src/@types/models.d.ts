import { IMarkmapOptions } from "markmap-common";

type FrontmatterOptions = Partial<IMarkmapOptions> & {
  screenshotFgColor?: string;
  highlight?: boolean;
};
