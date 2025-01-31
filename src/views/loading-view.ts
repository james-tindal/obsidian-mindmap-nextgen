import { ItemView, WorkspaceLeaf } from 'obsidian'
import { MM_VIEW_TYPE } from 'src/constants'

export class LoadingView extends ItemView {
  private static instances: LoadingView[] = []
  public getViewType() { return MM_VIEW_TYPE }
  public getDisplayText() { return 'Mindmap' }
  public getIcon() { return 'dot-network' }
  private isLoadingView = true

  constructor(leaf: WorkspaceLeaf) {
    super(leaf)
    LoadingView.instances.push(this)
    this.containerEl.append('Loading...')
  }

  public static closeAll() {
    this.instances.forEach(view => view.leaf.detach())
  }

  public async onClose() {
    delete LoadingView.instances[LoadingView.instances.indexOf(this)]
  }

  public static isLoadingView(x: any): x is LoadingView {
    return typeof x === 'object'
        && 'isLoadingView' in x
        && x.isLoadingView === true
  }
}
