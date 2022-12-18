type IMarkmapOptions = import("markmap-common").IMarkmapOptions;
type IMarkmapJSONOptions = import("markmap-common").IMarkmapJSONOptions;

type FrontmatterOptions = Partial<IMarkmapOptions> & {
  screenshotFgColor?: string;
  highlight?: boolean;
};

type TokenWithChildren = Remarkable.Remarkable.Token & {
  content?: string;
  children?: TokenWithChildren[];
};

type CustomFrontmatter = {
  markmap: IMarkmapJSONOptions & {
    screenshotFgColor: string;
    highlight?: boolean;
  };
};
