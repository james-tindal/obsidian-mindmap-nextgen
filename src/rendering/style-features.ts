import { cssClasses } from "src/constants"
import { settingChanges } from "src/filesystem"
import Plugin from "src/main"
import { layoutReady } from "src/utilities"
import { views } from "src/views/view-manager"
import { globalStyle, toggleBodyClass, settingTriggers as t, themeChange } from "./style-tools"

export function loadStyleFeatures(plugin: Plugin) {
  globalStyle.registerStyleElement(plugin);
  useThemeFont();
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


// Color setting updates
settingChanges.listen("coloring", views.renderAll);
settingChanges.listen("defaultColor", views.renderAll);
settingChanges.listen("defaultThickness", views.renderAll);
settingChanges.listen("depth1Color", views.renderAll);
settingChanges.listen("depth1Thickness", views.renderAll);
settingChanges.listen("depth2Color", views.renderAll);
settingChanges.listen("depth2Thickness", views.renderAll);
settingChanges.listen("depth3Color", views.renderAll);
settingChanges.listen("depth3Thickness", views.renderAll);
settingChanges.listen("colorFreezeLevel", views.renderAll);

//
settingChanges.listen("titleAsRootNode", views.renderAll);