import { TFile } from "obsidian"

import { PluginSettings } from "src/filesystem";
import Plugin from "src/main";
import View from "./view"
import { LayoutManager, MindmapSubject } from "./layout-manager"
import { EventListeners } from "./event-listeners"
import { registerEvents } from "./register-events"
import { ViewCreatorManager } from "./view-creator-manager"
import { CreateLeafIn, LeafManager } from "./leaf-manager"


export function ViewManager(plugin: Plugin, settings: PluginSettings, layoutManager: LayoutManager) {

  const views = Views();
  const viewCreatorManager = new ViewCreatorManager(plugin, settings, views);
  const createLeafIn = CreateLeafIn(settings.splitDirection);
  const leafManager = LeafManager(views, createLeafIn, viewCreatorManager.constructView);
  const eventListeners = EventListeners(views, settings, layoutManager, leafManager)

  registerEvents(plugin, eventListeners, views, viewCreatorManager.setViewCreator, settings);
}

type Get<MSV extends MindmapSubject | View> = MSV extends View ? MindmapSubject : View;

export type Views = ReturnType<typeof Views>;
function Views() {
  const subject2view = new Map<MindmapSubject, View>();
  const view2subject = new Map<View, MindmapSubject>();

  const views = {
    has: (subject: MindmapSubject) => subject2view.has(subject),
    get: <MSV extends MindmapSubject | View>(msv: MSV): Get<MSV> | undefined =>
      View.isView(msv)
        ? <Get<MSV>> view2subject.get(msv)
        : <Get<MSV>> subject2view.get(msv),
    set(subject: MindmapSubject, view: View) {
      views.delete(view);
      views.delete(subject);
      subject2view.set(subject, view);
      view2subject.set(view, subject);

      view.register(() =>  views.delete(view))
    },
    delete(msv: MindmapSubject | View) {
      if (View.isView(msv)) {
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
