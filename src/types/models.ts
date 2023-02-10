type IMarkmapOptions = import("markmap-common").IMarkmapOptions;
type IMarkmapJSONOptions = import("markmap-common").IMarkmapJSONOptions;

export type FrontmatterOptions = Partial<IMarkmapOptions & {
  screenshotTextColor: string;
  screenshotBgColor: string;
  highlight: boolean;
  titleAsRootNode: boolean;
}>;

export type TokenWithChildren = Remarkable.Remarkable.Token & {
  content?: string;
  children?: TokenWithChildren[];
};

export type CustomFrontmatter = {
  markmap: IMarkmapJSONOptions & {
    screenshotTextColor: string;
    screenshotBgColor: string;
    highlight?: boolean;
    titleAsRootNode: boolean;
  };
};
