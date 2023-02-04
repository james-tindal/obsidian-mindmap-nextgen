import { debounce } from "obsidian"
import { PluginSettings, settingChanges } from "src/filesystem"
import Plugin from "src/main"
import { EventListeners } from "./event-listeners"
import View from "./view"
import { ViewCreatorManager } from "./view-creator-manager"
import { Views } from "./view-manager"

export async function registerEvents(plugin: Plugin, listeners: EventListeners, views: Views, setViewCreator: ViewCreatorManager['setViewCreator'], settings: PluginSettings) {
  listeners.appLoading(setViewCreator);
  const mindmapLayoutReady = new Promise(resolve =>
    app.workspace.onLayoutReady(() =>
      listeners.layoutReady().then(resolve)
    ));

  await mindmapLayoutReady;
  listeners.layoutChange();

  plugin.registerEvent(app.workspace.on('layout-change', listeners.layoutChange));

  ;[
    app.workspace.on("editor-change", debounce(listeners.editorChange, 300, true)),
    app.workspace.on("file-open", listeners.fileOpen),
    app.vault.on("rename", listeners.renameFile)

  ]
  .forEach(listener => plugin.registerEvent(listener));

  View.onPinToggle(view => {
    const subject = views.get(view)!;
    if (subject === "unpinned")
      listeners.viewRequest["menu-pin"]()
    else
      listeners.viewRequest["menu-unpin"](subject)
  })

  plugin.addCommand({
    id: "mindmapnextgen:unpinned",
    name: "Open unpinned mindmap",
    callback: listeners.viewRequest["hotkey-open-unpinned"],
    hotkeys: [],
  });

  plugin.addCommand({
    id: "mindmapnextgen:pinned",
    name: "Open pinned mindmap",
    callback: listeners.viewRequest["hotkey-open-pinned"],
    hotkeys: [],
  });

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

  // Use theme font
  // Would be nice to have self-contained features which can register event listeners.

  function onThemeChange(callback: (theme: string) => void) {
    const originalSetTheme = app.customCss.setTheme.bind(app.customCss);
    app.customCss.setTheme = theme => {
      callback(theme);
      return originalSetTheme(theme);
    }
    plugin.register(() => app.customCss.setTheme = originalSetTheme);
  }

  const useThemeFont = () => {
    if (settings.useThemeFont)
      document.body.classList.add("mmng-use-theme-font")
    else
      document.body.classList.remove("mmng-use-theme-font")
    views.renderAll();
  }
  useThemeFont();
  settingChanges.listen("useThemeFont", useThemeFont);

  const styleText = () => {
    const { font } = getComputedStyle(document.body);
    return `body.mmng-use-theme-font .markmap {font: ${font}}`;
  }
  const styleEl = document.head.createEl('style', { text: styleText() });
  const updateFont = () => styleEl.textContent = styleText();

  onThemeChange(() => {
    if (settings.useThemeFont) views.renderAll();
  })
  settingChanges.listen("useThemeFont", updateFont);
}
