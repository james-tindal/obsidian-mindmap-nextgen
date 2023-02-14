import { TFile } from "obsidian"

import { GlobalSettings } from "src/filesystem";
import Plugin from "src/main";
import MindmapTabView from "./view"
import { LayoutManager, MindmapSubject } from "./layout-manager"
import { EventListeners } from "./event-listeners"
import { registerEvents } from "./register-events"
import { ViewCreatorManager } from "./view-creator-manager"
import { CreateLeafIn, LeafManager } from "./leaf-manager"
import { renderTabs$ } from "src/rendering/style-features"
import Callbag from "src/utilities/callbag"


export const views = Views();

export function ViewManager(plugin: Plugin, settings: GlobalSettings, layoutManager: LayoutManager) {

  const viewCreatorManager = new ViewCreatorManager(plugin, settings, views);
  const createLeafIn = CreateLeafIn(settings.splitDirection);
  const leafManager = LeafManager(views, createLeafIn, viewCreatorManager.constructView);
  const eventListeners = EventListeners(views, settings, layoutManager, leafManager)

  registerEvents(plugin, eventListeners, views, viewCreatorManager.setViewCreator, settings);

  Callbag.subscribe(renderTabs$, views.renderAll)
}

type Get<MSV extends MindmapSubject | MindmapTabView> = MSV extends MindmapTabView ? MindmapSubject : MindmapTabView;

export type Views = ReturnType<typeof Views>;
function Views() {
  const subject2view = new Map<MindmapSubject, MindmapTabView>();
  const view2subject = new Map<MindmapTabView, MindmapSubject>();

  const views = {
    has: (subject: MindmapSubject) => subject2view.has(subject),
    get: <MSV extends MindmapSubject | MindmapTabView>(msv: MSV): Get<MSV> | undefined =>
      msv instanceof MindmapTabView
        ? <Get<MSV>> view2subject.get(msv)
        : <Get<MSV>> subject2view.get(msv),
    set(subject: MindmapSubject, view: MindmapTabView) {
      views.delete(view);
      views.delete(subject);
      subject2view.set(subject, view);
      view2subject.set(view, subject);

      view.register(() =>  views.delete(view))
    },
    delete(msv: MindmapSubject | MindmapTabView) {
      if (msv instanceof MindmapTabView) {
        const view = msv;
        const subject = view2subject.get(view)!;
        view2subject.delete(view);
        subject2view.delete(subject);
      }
      else {
        const subject = msv;
        const view = subject2view.get(subject)!;
        view2subject.delete(view);
        subject2view.delete(subject);
      }
    },

    renderAll() {
      subject2view.forEach((view, subject) => {
        const pinned = subject !== "unpinned";
        const file = pinned ? subject : getActiveFile();
        if (file) view.render(file);
      })
    },

    getByPath(path: string) {
      for (const [view, subject] of view2subject) {
        if (subject === "unpinned") continue;
        const file = subject;
        if (file && file.path === path)
          return { view, file }
      }
    }
  }

  return views
}

export function getActiveFile(): TFile | null {
  const af = app.workspace.getActiveFile();
  return af?.extension === "md" ? af : null;
}
