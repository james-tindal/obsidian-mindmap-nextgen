// import { getLanguage } from 'obsidian'
// const locale = getLanguage()
// locale string value is based on: https://github.com/obsidianmd/obsidian-translations?tab=readme-ov-file#existing-languages
// 'zh' is simplified Chinese, 'zh-TW' is traditional Chinese
// const isSimplifiedChinese = locale === 'zh'
// const isTraditionalChinese = locale.endsWith('TW')

export default {
  commands: {
    unpinned: '打开‘非固定模式’思维导图',
    pinned: '打开‘固定模式’思维导图',
  },
  menu: {
    copyScreenshot: '复制截图',
    collapseAll: '折叠所有',
    toolbar: {
      toolbar: '工具栏',
      show: '显示',
      hide: '隐藏',
    },
    pin: {
      pin: '固定',
      unpin: '取消固定',
    }
  },
  fileSettingsButton: '编辑思维导图',
  settings: {
    explanations: {
      file: [
        '要调整单个文件的设置，请点击',
        '按钮(位于Markdown或Mindmap标签右上角)',
      ],
      codeBlock: [
        '要修改每个代码块的设置，请将鼠标悬停在上面并点击',
        '右上角的按钮',
      ],
    },
    level: {
      global: '全局',
      file: '文件',
      codeBlock: '代码块',
    },
    sectionHeadings: {
      coloring: '配色',
      thickness: {
        heading: '字体粗细',
        subHeading: '单位（像素）'
      },
      screenshots: {
        heading: '截图',
        subHeading: '选择你想要的截图样式',
      },
      markmap: {
        heading: 'Markmap 设置',
        subHeading: '调整Markup绘制思维导图的细节',
      },
    },
    settings: {
      splitDirection: {
        name: '分割方向',
        description: '打开思维导图时分割窗口的方向',
        horizontal: '水平',
        vertical: '垂直',
      },
      highlight: {
        name: '高亮内联思维导图',
        description: '使用高对比背景颜色用于内联思维导图',
      },
      titleAsRootNode: {
        name: '使用标题作为根节点',
        description: '启用后，思维导图的根节点将使用文档的标题',
      },
      coloring: {
        name: '配色方案',
        depth: '基于深度的配色',
        branch: '基于分支的配色',
        single: '单色配色',
        description: {
          branch: '在分支配色模式下，颜色是随机选择的',
          depth: '在基于深度的配色模式下，分支根据其在思维导图中的深度着色',
          single: '在单色配色模式下，所有分支都是相同的颜色'
        },
      },
      depth1Color: {
        name: '深度1颜色',
        description: '思维导图第一层级的颜色',
      },
      depth2Color: {
        name: '深度2颜色',
        description: '思维导图第二层级的颜色',
      },
      depth3Color: {
        name: '深度3颜色',
        description: '思维导图第三层级的颜色',
      },
      defaultColor: {
        singleName: '颜色',
        name: '默认颜色',
        description: '思维导图第四层级及以上的颜色',
      },
      colorFreezeLevel: {
        name: '颜色冻结层级',
        description: '超过冻结层级的子分支将使用其上级节点的颜色',
        placeholder: '示例: 3'
      },
      depth1Thickness: '深度1',
      depth2Thickness: '深度2',
      depth3Thickness: '深度3',
      defaultThickness: '默认',
      screenshotTextColor: {
        name: '截图文本颜色',
        description: '截图文本的颜色。切换开关在截图上禁用/启用该颜色',
      },
      screenshotBgStyle: {
        name: '截图背景样式',
        description: '选择截图的背景样式, 当使用特定颜色时, 将使用选定的颜色',
        transparent: '透明',
        color: '颜色',
        theme: '主题',
      },
      nodeMinHeight: {
        name: '节点最小高度',
        description: '思维导图节点的最小高度',
        placeholder: '示例: 16',
      },
      lineHeight: {
        name: '节点文本行高',
        description: '思维导图节点文本的行高',
        placeholder: '示例: 1em',
      },
      spacingVertical: {
        name: '垂直间距',
        description: '思维导图节点之间的垂直间距',
        placeholder: '示例: 5',
      },
      spacingHorizontal: {
        name: '水平间距',
        description: '思维导图节点之间的水平间距',
        placeholder: '示例: 80',
      },
      paddingX: {
        name: '水平内边距',
        description: '思维导图节点内容前的间距',
        placeholder: '示例: 8',
      },
      initialExpandLevel: {
        name: '初始展开层级',
        description: '设置思维导图的初始展开层级。0表示所有节点折叠, '
                   + '1表示只有根节点展开, 以此类推。要展开所有节点，设置为-1',
        placeholder: '示例: 2',
      },
      animationDuration: {
        name: '动画时长',
        description: '折叠/展开一个节点时的动画时长',
        placeholder: '示例: 500',
      },
      maxWidth: {
        name: '最大宽度',
        description: '每个节点的最大宽度。0表示无限制',
        placeholder: '示例: 130',
      },
    },
  },
}
