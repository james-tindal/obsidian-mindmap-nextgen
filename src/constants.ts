export const MM_VIEW_TYPE = 'mindmap-nextgen-plugin'
export const MD_VIEW_TYPE = 'markdown'

// https://regex101.com/r/gw85cc/2
export const INTERNAL_LINK_REGEX = /\[\[(?<wikitext>.*)\]\]|<a href="(?<mdpath>.*)">(?<mdtext>.*)<\/a>/gim

export const cssClasses = {
  highlight: 'mmng-highlight-inline',
  useThemeFont: 'mmng-use-theme-font',
}
