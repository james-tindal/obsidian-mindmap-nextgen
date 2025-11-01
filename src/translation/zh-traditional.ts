export default {
  commands: {
    unpinned: '打開『非固定模式』思維導圖',
    pinned: '打開『固定模式』思維導圖',
  },
  menu: {
    copyScreenshot: '複製截圖',
    collapseAll: '摺疊所有',
    toolbar: {
      toolbar: '工具欄',
      show: '顯示',
      hide: '隱藏',
    },
    pin: {
      pin: '固定',
      unpin: '取消固定',
    }
  },
  fileSettingsButton: '編輯思維導圖',
  settings: {
    explanations: {
      file: [
        '要調整單個文件的設置，請點擊',
        '按鈕(位於Markdown或Mindmap標籤右上角)',
      ],
      codeBlock: [
        '要修改每個代碼塊的設置，請將鼠標懸停在上面並點擊',
        '右上角的按鈕',
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
        heading: '字體粗細',
        subHeading: '單位（像素）'
      },
      screenshots: {
        heading: '截圖',
        subHeading: '選擇你想要的截圖樣式',
      },
      markmap: {
        heading: 'Markmap 設置',
        subHeading: '調整Markmap繪製思維導圖的細節',
      },
    },
    settings: {
      splitDirection: {
        name: '分割方向',
        description: '打開思維導圖時分割窗口的方向',
        horizontal: '水平',
        vertical: '垂直',
      },
      highlight: {
        name: '高亮內聯思維導圖',
        description: '使用高對比背景顏色用於內聯思維導圖',
      },
      titleAsRootNode: {
        name: '使用標題作為根節點',
        description: '啟用後，思維導圖的根節點將使用文檔的標題',
      },
      coloring: {
        name: '配色方案',
        depth: '基於深度的配色',
        branch: '基於分支的配色',
        single: '單色配色',
        description: {
          branch: '在分支配色模式下，顏色是隨機選擇的',
          depth: '在基於深度的配色模式下，分支根據其在思維導圖中的深度著色',
          single: '在單色模式下，所有分支都是相同的顏色'
        },
      },
      depth1Color: {
        name: '深度1顏色',
        description: '思維導圖第一層級的顏色',
      },
      depth2Color: {
        name: '深度2顏色',
        description: '思維導圖第二層級的顏色',
      },
      depth3Color: {
        name: '深度3顏色',
        description: '思維導圖第三層級的顏色',
      },
      defaultColor: {
        singleName: '顏色',
        name: '默認顏色',
        description: '思維導圖第四層級及以上的顏色',
      },
      colorFreezeLevel: {
        name: '顏色凍結層級',
        description: '超過凍結層級的子分支將使用其上級節點的顏色',
        placeholder: '示例: 3'
      },
      depth1Thickness: '深度1',
      depth2Thickness: '深度2',
      depth3Thickness: '深度3',
      defaultThickness: '默認',
      screenshotTextColor: {
        name: '截圖文本顏色',
        description: '截圖文本的顏色。切換開關以禁用/啟用截圖上的此顏色',
      },
      screenshotBgStyle: {
        name: '截圖背景樣式',
        description: '選擇截圖的背景樣式, 當使用特定顏色時, 將使用選定的顏色',
        transparent: '透明',
        color: '顏色',
        theme: '主題',
      },
      nodeMinHeight: {
        name: '節點最小高度',
        description: '思維導圖節點的最小高度',
        placeholder: '示例: 16',
      },
      lineHeight: {
        name: '節點文本行高',
        description: '思維導圖節點文本的行高',
        placeholder: '示例: 1em',
      },
      spacingVertical: {
        name: '垂直間距',
        description: '思維導圖節點之間的垂直間距',
        placeholder: '示例: 5',
      },
      spacingHorizontal: {
        name: '水平間距',
        description: '思維導圖節點之間的水平間距',
        placeholder: '示例: 80',
      },
      paddingX: {
        name: '水平內邊距',
        description: '思維導圖節點內容前的間距',
        placeholder: '示例: 8',
      },
      initialExpandLevel: {
        name: '初始展開層級',
        description: '設置思維導圖的初始展開層級。0表示所有節點摺疊, '
                   + '1表示只有根節點展開, 以此類推。要展開所有節點，設置為-1',
        placeholder: '示例: 2',
      },
      animationDuration: {
        name: '動畫時長',
        description: '摺疊/展開一個節點時的動畫時長',
        placeholder: '示例: 500',
      },
      maxWidth: {
        name: '最大寬度',
        description: '每個節點的最大寬度。0表示無限制',
        placeholder: '示例: 130',
      },
    },
  },
}
