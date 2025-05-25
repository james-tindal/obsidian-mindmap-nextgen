import { globalSettings, settingChanges } from 'src/settings/filesystem'
import Callbag from 'src/utilities/callbag'
import { globalStyle, settingTriggers as t } from './style-tools'


const { source: renderCodeblocks$, push: renderCodeblocks } = Callbag.subject<void>()
const { source: renderTabs$, push: renderTabs } = Callbag.subject<void>()
export { renderCodeblocks$, renderTabs$ }
const renderAll = () => { renderTabs(); renderCodeblocks() }

export function loadStyleFeatures() {
  globalStyle.registerStyleElement()
  lineThickness()
  lineHeight()
}

async function lineThickness() {
  globalStyle.add(t.defaultThickness, () => `
    .markmap path.markmap-link,
    .markmap g.markmap-node line {
      stroke-width: ${globalSettings.defaultThickness} }`)

  globalStyle.add(t.depth1Thickness, () => `
    .markmap g[data-depth="0"].markmap-node line {
      stroke-width: ${globalSettings.depth1Thickness} }`)

  globalStyle.add(t.depth2Thickness, () => `
    .markmap path.markmap-link[data-depth="1"],
    .markmap    g.markmap-node[data-depth="1"] line {
      stroke-width: ${globalSettings.depth2Thickness} }`)

  globalStyle.add(t.depth3Thickness, () => `
    .markmap path.markmap-link[data-depth="2"],
    .markmap    g.markmap-node[data-depth="2"] line {
      stroke-width: ${globalSettings.depth3Thickness} }`)
}

async function lineHeight() {
  globalStyle.add(t.lineHeight, () => `:root { --mm-line-height: ${globalSettings.lineHeight} }`)
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
