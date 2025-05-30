import { getActiveFile } from './get-active-file'
import { MindmapSubject } from './layout-manager'
import MindmapTabView from './view'

type Get<MSV extends MindmapSubject | MindmapTabView> = MSV extends MindmapTabView ? MindmapSubject : MindmapTabView


const subject2view = new Map<MindmapSubject, MindmapTabView>()
const view2subject = new Map<MindmapTabView, MindmapSubject>()

const views = {
  has: (subject: MindmapSubject) => subject2view.has(subject),
  get: <MSV extends MindmapSubject | MindmapTabView>(msv: MSV): Get<MSV> | undefined =>
    msv instanceof MindmapTabView
      ? <Get<MSV>> view2subject.get(msv)
      : <Get<MSV>> subject2view.get(msv),
  set(subject: MindmapSubject, view: MindmapTabView) {
    views.delete(view)
    views.delete(subject)
    subject2view.set(subject, view)
    view2subject.set(view, subject)

    view.register(() =>  views.delete(view))
  },
  delete(msv: MindmapSubject | MindmapTabView) {
    if (msv instanceof MindmapTabView) {
      const view = msv
      const subject = view2subject.get(view)!
      view2subject.delete(view)
      subject2view.delete(subject)
    }
    else {
      const subject = msv
      const view = subject2view.get(subject)!
      view2subject.delete(view)
      subject2view.delete(subject)
    }
  },

  renderAll() {
    subject2view.forEach((view, subject) => {
      const pinned = subject !== 'unpinned'
      const file = pinned ? subject : getActiveFile()
      if (file) view.render(file)
    })
  },

  getByPath(path: string) {
    for (const [view, subject] of view2subject) {
      if (subject === 'unpinned') continue
      const file = subject
      if (file && file.path === path)
        return { view, file }
    }
  }
}

export default views
