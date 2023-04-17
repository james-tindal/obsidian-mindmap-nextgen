import { TFile } from "obsidian"

import { FileSettings, GlobalSettings } from "src/settings/filesystem"
import { CodeBlock } from "./types"
import { FileTab } from "./types"
import { MaybePromise } from "src/utilities/utilities"


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
  leaf: FileTab.Leaf
  view: FileTab.View
  containerEl: HTMLElement
  isCurrent: boolean
  file: FileRow
  codeBlocks: DbSet<CodeBlockRow>
}

export type FileRow = {
  handle: TFile
  settings: MaybePromise<FileSettings>
  tabs: DbSet<TabRow>
}

export type CodeBlockRow = {
  codeBlock: CodeBlock
  tab: TabRow
}

export type Database = {
  globalSettings: GlobalSettings
  tabs: DbSet<TabRow>
  files: DbSet<FileRow>
  codeBlocks: DbSet<CodeBlockRow>
  codeBlocksWaiting: DbSet<CodeBlock>
}

export const TabRow = (args: Omit<TabRow, "codeBlocks" | "isCurrent">): TabRow => ({ ...args, isCurrent: false, codeBlocks: new DbSet() })
export const FileRow = (args: Omit<FileRow, "tabs">): FileRow => ({ ...args, tabs: new DbSet() })
export const CodeBlockRow = (row: CodeBlockRow) => row

export const createDb = (globalSettings: GlobalSettings): Database => ({
  globalSettings,
  tabs: new DbSet(),
  files: new DbSet(),
  codeBlocks: new DbSet(),
  codeBlocksWaiting: new DbSet()
})
