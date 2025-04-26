import { TFile } from 'obsidian'

export function getActiveFile(): TFile | null {
  const af = app.workspace.getActiveFile()
  return af?.extension === 'md' ? af : null
}
