import { cssClasses } from "src/constants"
import { settingChanges, settingsReady } from "src/filesystem"
import Plugin from "src/main"
import { layoutReady } from "src/utilities"
import { views } from "src/views/view-manager"
import { globalStyle, toggleBodyClass, settingTriggers as t, themeChange } from "./style-tools"

export function loadStyleFeatures(plugin: Plugin) {
  globalStyle.registerStyleElement(plugin);
  useThemeFont();
  lineThickness();
  lineHeight();
}

async function useThemeFont() {
  await layoutReady;

  globalStyle.add([t.useThemeFont, themeChange], () => {
    const { font } = getComputedStyle(document.body);
    return `body.mmng-use-theme-font .markmap {font: ${font}}`;
  }, () => {
    views.renderAll()
  })

  toggleBodyClass("useThemeFont", cssClasses.useThemeFont)
}

async function lineThickness() {
  const s = await settingsReady;
  
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
  const s = await settingsReady;
  globalStyle.add(t.lineHeight, () => `:root { --mm-line-height: ${s.lineHeight} }`)
}





// Color setting updates
settingChanges.listen("coloring", views.renderAll);
settingChanges.listen("defaultColor", views.renderAll);
settingChanges.listen("depth1Color", views.renderAll);
settingChanges.listen("depth2Color", views.renderAll);
settingChanges.listen("depth3Color", views.renderAll);
settingChanges.listen("colorFreezeLevel", views.renderAll);

//
settingChanges.listen("titleAsRootNode", views.renderAll);