import { ViewCreator, WorkspaceLeaf } from "obsidian"
import { MM_VIEW_TYPE } from "src/constants"
import { GlobalSettings } from "src/settings/filesystem"
import Plugin from "src/main"
import { MindmapSubject } from "./layout-manager"
import MindmapTabView from "./view"
import { Views, getActiveFile } from "./view-manager"

export class ViewCreatorManager {
  private static plugin: Plugin;
  private static settings: GlobalSettings;
  private static views: Views;
  private static viewCreator: ViewCreator;
  private static instance: ViewCreatorManager;
  private static waitForLastConstruct = Promise.resolve();

  constructor(plugin: Plugin, settings: GlobalSettings, views: Views) {
    if (ViewCreatorManager.instance) return ViewCreatorManager.instance;
    ViewCreatorManager.instance = this;
    ViewCreatorManager.plugin = plugin;
    ViewCreatorManager.settings = settings;
    ViewCreatorManager.views = views;

    plugin.registerView(MM_VIEW_TYPE, (leaf: WorkspaceLeaf) => ViewCreatorManager.viewCreator(leaf));
  }

  public setViewCreator(vc: ViewCreator) { ViewCreatorManager.viewCreator = vc };

  public constructView(leaf: WorkspaceLeaf, subject: MindmapSubject) {
    return ViewCreatorManager.enqueue(async () => {
      const { views, settings } = ViewCreatorManager;
      const pinned = subject !== "unpinned";
      const displayText = pinned ? subject.basename : "Mindmap";
  
      ViewCreatorManager.viewCreator = () => {
        const view = new MindmapTabView(settings, leaf, displayText, pinned);
        views.set(subject, view);
        return view;
      }
      await leaf.setViewState({ type: MM_VIEW_TYPE, active: true });

      const view = leaf.view as MindmapTabView;
      const file = pinned ? subject : getActiveFile();

      ViewCreatorManager.waitUntilActive(leaf)
      .then(() =>
        file && view.firstRender(file))
    })
  }

  private static enqueue(onfulfilled: () => Promise<void>) {
    return ViewCreatorManager.waitForLastConstruct = ViewCreatorManager.waitForLastConstruct.then(onfulfilled);
  }

  private static waitUntilActive = (leaf: WorkspaceLeaf) =>
    new Promise<void>(resolve => {
      const listener =
        app.workspace.on("active-leaf-change", activeLeaf => {
          if (activeLeaf === leaf) {
            resolve();
            app.workspace.offref(listener);
          }
        })
      ViewCreatorManager.plugin.registerEvent(listener);
    })
}