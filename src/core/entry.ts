import { Plugin } from 'obsidian'

export const __entry = {} as { plugin: Plugin }

export default class extends Plugin {
  onload() {
    __entry.plugin = this
    import('./main')
  }
}
