import { TFile } from 'obsidian'


export type MindmapSubject = TFile | 'unpinned'

export type Layout = Tabs | Split
type Split = (Split | Tabs)[]
type Tabs = (FlatSubject | null)[]

type FlatSubject =
| { type: 'unpinned' }
| { type: 'pinned', path: TFile['path'] }
