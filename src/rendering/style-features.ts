import { cssClasses } from 'src/constants'
import { settingChanges, settingsReady } from 'src/settings/filesystem'
import Callbag from 'src/utilities/callbag'
import { layoutReady } from 'src/utilities/layout-ready'
import { globalStyle, toggleBodyClass, settingTriggers as t, themeChange } from './style-tools'


const { source: renderCodeblocks$, push: renderCodeblocks } = Callbag.subject<void>()
const { source: renderTabs$, push: renderTabs } = Callbag.subject<void>()
export { renderCodeblocks$, renderTabs$ }
const renderAll = () => { renderTabs(); renderCodeblocks() }

export function loadStyleFeatures() {
  globalStyle.registerStyleElement()
  useThemeFont()
  lineThickness()
  lineHeight()
}

async function useThemeFont() {
  await layoutReady

  globalStyle.add([t.useThemeFont, themeChange], () => {
    const { font } = getComputedStyle(document.body)
    return `body.mmng-use-theme-font .markmap {font: ${font}}`
  }, () => {
    renderAll()
  })

  toggleBodyClass('useThemeFont', cssClasses.useThemeFont)
}

async function lineThickness() {
  const s = await settingsReady
  
  globalStyle.add(t.defaultThickness, () => `
    .markmap path.markmap-link,
    .markmap g.markmap-node line {
      stroke-width: ${s.defaultThickness} }`)

  globalStyle.add(t.depth1Thickness, () => `
    .markmap g[data-depth="0"].markmap-node line {
      stroke-width: ${s.depth1Thickness} }`)

  globalStyle.add(t.depth2Thickness, () => `
    .markmap path.markmap-link[data-depth="1"],
    .markmap    g.markmap-node[data-depth="1"] line {
      stroke-width: ${s.depth2Thickness} }`)

  globalStyle.add(t.depth3Thickness, () => `
    .markmap path.markmap-link[data-depth="2"],
    .markmap    g.markmap-node[data-depth="2"] line {
      stroke-width: ${s.depth3Thickness} }`)
}

async function lineHeight() {
  const s = await settingsReady
  globalStyle.add(t.lineHeight, () => `:root { --mm-line-height: ${s.lineHeight} }`)
}


// Color setting updates
settingChanges.listen('coloring', renderAll)
settingChanges.listen('defaultColor', renderAll)
settingChanges.listen('depth1Color', renderAll)
settingChanges.listen('depth2Color', renderAll)
settingChanges.listen('depth3Color', renderAll)
settingChanges.listen('colorFreezeLevel', renderAll)
//

settingChanges.listen('animationDuration', renderAll)
settingChanges.listen('initialExpandLevel', renderAll)
settingChanges.listen('maxWidth', renderAll)
settingChanges.listen('nodeMinHeight', renderAll)
settingChanges.listen('paddingX', renderAll)
settingChanges.listen('spacingHorizontal', renderAll)
settingChanges.listen('spacingVertical', renderAll)
settingChanges.listen('titleAsRootNode', renderTabs)
