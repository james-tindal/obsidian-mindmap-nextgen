import { TFile } from 'obsidian'

import { MarkdownTab } from './types'
import { CodeBlock } from 'src/new/codeBlockHandler'


export class DbSet<T> extends Set<T> {
  filter(fn: (row: T) => any) {
    const accumulator = new DbSet<T>()
    for (const row of this)
      if (fn(row)) accumulator.add(row)
    return accumulator
  }

  find(fn: (row: T) => any) {
    for (const row of this)
      if (fn(row)) return row
  }

  flatMap<Out>(fn: (row: T) => DbSet<Out>): DbSet<Out> {
    const accumulator = new DbSet<Out>()
    for (const row1 of this)
      for (const row2 of fn(row1))
        accumulator.add(row2)
    return accumulator
  }

  map<Out>(fn: (row: T) => Out): DbSet<Out> {
    const accumulator = new DbSet<Out>()
    for (const row of this)
      accumulator.add(fn(row))
    return accumulator
  }
}


export type TabRow = {
  leaf: MarkdownTab.Leaf
  view: MarkdownTab.View
  containerEl: HTMLElement
  isCurrent: boolean
  file: FileRow
  codeBlocks: DbSet<CodeBlockRow>
}

export type FileRow = {
  handle: TFile
  tabs: DbSet<TabRow>
}

export type CodeBlockRow = {
  codeBlock: CodeBlock
  tab: TabRow
}

export type Database = {
  tabs: DbSet<TabRow>
  files: DbSet<FileRow>
  codeBlocks: DbSet<CodeBlockRow>
  codeBlocksWaiting: DbSet<CodeBlock>
}

export const TabRow = (args: Omit<TabRow, 'codeBlocks' | 'isCurrent'>): TabRow => ({ ...args, isCurrent: false, codeBlocks: new DbSet() })
export const FileRow = (args: Omit<FileRow, 'tabs'>): FileRow => ({ ...args, tabs: new DbSet() })
export const CodeBlockRow = (row: CodeBlockRow) => row

export const createDb = (): Database => ({
  tabs: new DbSet(),
  files: new DbSet(),
  codeBlocks: new DbSet(),
  codeBlocksWaiting: new DbSet()
})
