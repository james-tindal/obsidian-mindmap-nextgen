import { WorkspaceLeaf, ItemView, MarkdownView, MarkdownSectionInformation, TFile } from 'obsidian'
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

export const leafHasFile = Object.assign(
  (leaf: WorkspaceLeaf): leaf is WorkspaceLeaf & { view: { file: TFile }} =>
    'file' in leaf.view && leaf.view.file instanceof TFile,
  { message: 'Leaf has no file' as const }
)

export class CodeBlock {
  constructor(
    public markdown: string,
    public containerEl: HTMLDivElement,
    public getSectionInfo: () => MarkdownSectionInformation
  ) {}
}

type AssertPredicate<In, Out extends In> = ((x: In) => x is Out) & { message?: string} 
export function assert<In, Out extends In>(
  predicate: AssertPredicate<In, Out>,
  x: In,
  message?: string
): asserts x is Out {
  if (!predicate(x))
    throw new Error(predicate.message ?? message ?? predicate.toString())
}

export const toAssert = <In, Out extends In>(
  predicate: AssertPredicate<In, Out>,
  message?: string
) => (
  x: In,
  message_?: string
) => assert(predicate, x, message ?? message_)

export const exists = Object.assign(
  <T>(x: T): x is NonNullable<T> =>
    x !== null && x !== undefined,
  { message: 'Must not be null or undefined' }
)
