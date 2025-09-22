import { MarkdownView } from 'obsidian'
import Callbag, { filter, map, reject } from 'src/utilities/callbag'
import { fromObsidianEvent } from 'src/utilities/from-obsidian-event'


const activeMarkdownView$ = Callbag.pipe(
  fromObsidianEvent(app.workspace, 'active-leaf-change').unary(),
  map(leaf => leaf?.view),
  filter(view => view instanceof MarkdownView)
)

const views = new Set<MarkdownView>()

export const newActiveMarkdownView$ = Callbag.pipe(
  activeMarkdownView$,
  map(view => {
    if (views.has(view))
      return
    views.add(view)
    view.register(() =>
      views.delete(view))
    return view
  }),
  reject(x => x === undefined)
)
