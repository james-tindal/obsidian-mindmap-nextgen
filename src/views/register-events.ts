import { debounce } from "obsidian"
import Plugin from "src/main"
import { EventListeners } from "./event-listeners"
import View from "./view"
import { ViewCreatorManager } from "./view-creator-manager"
import { Views } from "./view-manager"

export async function registerEvents(plugin: Plugin, listeners: EventListeners, views: Views, setViewCreator: ViewCreatorManager['setViewCreator']) {
  listeners.appLoading(setViewCreator);
  const mindmapLayoutReady = new Promise(resolve =>
    app.workspace.onLayoutReady(() => {
      listeners.layoutReady().then(resolve);
    }));

  await mindmapLayoutReady;

  plugin.registerEvent(app.workspace.on('layout-change', listeners.layoutChange));

  ;[
    app.workspace.on("editor-change", debounce(listeners.editorChange, 300, true)),
    app.workspace.on("file-open", listeners.fileOpen),
  ]
  .forEach(listener => plugin.registerEvent(listener));

  View.onPinToggle(view => {
    const subject = views.get(view);
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
}