import { WorkspaceLeaf, ItemView, MarkdownView, MarkdownSectionInformation } from 'obsidian'
import MindmapTabView from 'src/views/view'


export namespace Tab {
  export interface Leaf extends WorkspaceLeaf {}
  export interface View extends ItemView {}
}

export namespace MindmapTab {
  export interface Leaf extends WorkspaceLeaf { view: View }
  export const View = MindmapTabView 
  export interface View extends MindmapTabView {}
}

export namespace FileTab {
  export interface Leaf extends WorkspaceLeaf { view: View }
  export const View = MarkdownView
  export interface View extends MarkdownView {}
}

export class CodeBlock {
  constructor(
    public markdown: string,
    public containerEl: HTMLDivElement,
    public getSectionInfo: () => MarkdownSectionInformation
  ) {}
}