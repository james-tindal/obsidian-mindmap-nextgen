import { getLanguage } from 'obsidian'

const locale = getLanguage()
const isBritish = locale === 'en-GB'
const color = isBritish ? 'color' : 'colour'
const Color = isBritish ? 'Color' : 'Colour'

export default {
  commands: {
    unpinned: 'Open unpinned mindmap',
    pinned: 'Open pinned mindmap',
  },
  menu: {
    copyScreenshot: 'Copy screenshot',
    collapseAll: 'Collapse all',
    toolbar: {
      toolbar: 'toolbar',
      show: 'Show',
      hide: 'Hide',
    },
    pin: {
      pin: 'Pin',
      unpin: 'Unpin',
    }
  },
  fileSettingsButton: 'Edit mindmap settings',
  settings: {
    explanations: {
      file: [
        'To adjust settings for an individual file, click the',
        'button in the top-right corner of a Markdown or Mindmap tab.',
      ],
      codeBlock: [
        'To modify settings for each code block, hover over it and click the',
        'button that appears in the top-right corner.',
      ],
    },
    level: {
      global: 'global',
      file: 'file',
      codeBlock: 'codeBlock',
    },
    sectionHeadings: {
      coloring: `${Color}ing`,
      thickness: {
        heading: 'Thickness',
        subHeading: 'Measured in pixels'
      },
      screenshots: {
        heading: 'Screenshots',
        subHeading: 'Choose how you want your screenshots to look',
      },
      markmap: {
        heading: 'Markmap settings',
        subHeading: 'Settings for adjusting how Markmap draws the mindmaps',
      },
    },
    settings: {
      splitDirection: {
        name: 'Split direction',
        description: 'Direction to split the window when opening a mindmap',
        horizontal: 'Horizontal',
        vertical: 'Vertical',
      },
      highlight: {
        name: 'Highlight inline mindmap',
        description: `Use a contrasting background ${color} for inline mindmaps`,
      },
      titleAsRootNode: {
        name: 'Use title as root node',
        description: 'When on, the root node of the mindmap will be the title of the document',
      },
      coloring: {
        name: `${Color}ing approach`,
        depth: `Depth-based ${color}ing`,
        branch: `Branch-based ${color}ing`,
        single: `Single ${color}`,
        description: {
          branch: `In branch mode, ${color}s are chosen at random`,
          depth: `In depth mode, branches are ${color}ed based on their depth in the mindmap`,
          single: `In single ${color} mode, all branches are the same ${color}`
        },
      },
      depth1Color: {
        name: `Depth 1 ${color}`,
        description: `${Color} for the first level of the mindmap`,
      },
      depth2Color: {
        name: `Depth 2 ${color}`,
        description: `${Color} for the second level of the mindmap`,
      },
      depth3Color: {
        name: `Depth 3 ${color}`,
        description: `${Color} for the third level of the mindmap`,
      },
      defaultColor: {
        singleName: Color,
        name: `Default ${color}`,
        description: `${Color} for the fourth level and beyond`,
      },
      colorFreezeLevel: {
        name: `${Color} freeze level`,
        description: `All child branches will use the ${color} of their ancestor node beyond the freeze level`,
        placeholder: 'Example: 3'
      },
      depth1Thickness: 'Depth 1',
      depth2Thickness: 'Depth 2',
      depth3Thickness: 'Depth 3',
      defaultThickness: 'Default',
      screenshotTextColor: {
        name: `Screenshot text ${color}`,
        description: `Text ${color} for the screenshot. Toggle the switch on and off to disable/enable this ${color} on the screenshot`,
      },
      screenshotBgStyle: {
        name: 'Screenshot background style',
        description: `Select the background style for the screenshot, when using "${Color}" the ${color} picker value will be used`,
        transparent: 'Transparent',
        color: Color,
        theme: 'Theme',
      },
      nodeMinHeight: {
        name: 'Node Min Height',
        description: 'Minimum height for the mindmap nodes',
        placeholder: 'Example: 16',
      },
      lineHeight: {
        name: 'Node Text Line Height',
        description: 'Line height for content in mindmap nodes',
        placeholder: 'Example: 1em',
      },
      spacingVertical: {
        name: 'Vertical Spacing',
        description: 'Vertical spacing of the mindmap nodes',
        placeholder: 'Example: 5',
      },
      spacingHorizontal: {
        name: 'Horizontal Spacing',
        description: 'Horizontal spacing of the mindmap nodes',
        placeholder: 'Example: 80',
      },
      paddingX: {
        name: 'Horizontal padding',
        description: 'Leading space before the content of mindmap nodes',
        placeholder: 'Example: 8',
      },
      initialExpandLevel: {
        name: 'Initial expand level',
        description: 'Sets the initial depth of the mindmap. 0 means all nodes are collapsed, '
                   + '1 means only the root node is expanded, etc. To expand all nodes, set this to -1',
        placeholder: 'Example: 2',
      },
      animationDuration: {
        name: 'Animation duration',
        description: 'The animation duration when folding/unfolding a node',
        placeholder: 'Example: 500',
      },
      maxWidth: {
        name: 'Max width',
        description: 'The max width of each node. 0 for no limit',
        placeholder: 'Example: 130',
      },
    },
  },
}
