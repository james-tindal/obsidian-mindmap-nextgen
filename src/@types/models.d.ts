type IMarkmapOptions = import("markmap-common").IMarkmapOptions;
type IMarkmapJSONOptions = import("markmap-common").IMarkmapJSONOptions;

type FrontmatterOptions = Partial<IMarkmapOptions> & {
  screenshotTextColor?: string;
  screenshotBgColor: string;
  highlight?: boolean;
};

type TokenWithChildren = Remarkable.Remarkable.Token & {
  content?: string;
  children?: TokenWithChildren[];
};

type CustomFrontmatter = {
  markmap: IMarkmapJSONOptions & {
    screenshotTextColor: string;
    screenshotBgColor: string;
    highlight?: boolean;
  };
};
