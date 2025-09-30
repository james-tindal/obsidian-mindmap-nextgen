import { WorkspaceLeaf, ItemView, MarkdownView, TFile } from 'obsidian'
import MindmapView from 'src/views/view'


export namespace Tab {
  export interface Leaf extends WorkspaceLeaf {}
  export interface View extends ItemView {}
}

export namespace MindmapTab {
  export interface Leaf extends WorkspaceLeaf { view: View }
  export const View = MindmapView 
  export interface View extends MindmapView {}
}

export namespace MarkdownTab {
  export interface Leaf extends WorkspaceLeaf { view: View }
  export const View = MarkdownView
  export interface View extends MarkdownView {}
}

export const leafHasFile = Object.assign(
  (leaf: WorkspaceLeaf): leaf is WorkspaceLeaf & { view: { file: TFile }} =>
    'file' in leaf.view && leaf.view.file instanceof TFile,
  { message: 'Leaf has no file' as const }
)
