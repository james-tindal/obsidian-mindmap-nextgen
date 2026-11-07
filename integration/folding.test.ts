import type { ItemView, MarkdownView, WorkspaceLeaf } from 'obsidian'
import { afterEach, expect, test } from 'vitest'
import { evalInObsidian } from 'obsidian-integration-testing'
import { getTemporaryVault } from 'obsidian-integration-testing/vitest-global-setup-plugin'
import type { v2 } from '../src/settings/filesystem'

afterEach(async () => {
  await evalInObsidian({
    vaultPath: getTemporaryVault().path,
    callback: async ({ app, lib }) => {
      await lib.pressKey({ key: 'Escape' })
      const leaves: WorkspaceLeaf[] = []
      app.workspace.iterateRootLeaves(leaf => { leaves.push(leaf) })
      leaves.forEach(leaf => leaf.detach())
    },
  })
})

test('keeps the original default, then restores per-note folds across edits, reopening and plugin reload', async () => {
  const result = await evalInObsidian({
    vaultPath: getTemporaryVault().path,
    callback: async ({ app, lib, obsidianModule }) => {
      const id = 'obsidian-mindmap-nextgen'
      const viewType = 'mindmap-nextgen-plugin'
      const plugin = app.plugins.plugins[id]!
      const data = async (target = plugin) => await target.loadData() as v2
      const defaultEnabled = (await data()).settings.rememberFolding
      await lib.openSettingsTab({ tabId: id })
      const row = Array.from(document.querySelectorAll<HTMLElement>('.setting-item'))
        .find(row => row.querySelector('.setting-item-name')?.textContent === 'Remember node folding')
      const toggle = row?.querySelector<HTMLElement>('.checkbox-container')
      if (!toggle) throw new Error('Missing remember-folding setting')
      await lib.clickElement({ element: toggle })
      await lib.waitUntil({ predicate: async () => (await data()).settings.rememberFolding })
      await lib.pressKey({ key: 'Escape' })

      const file = app.vault.getFileByPath('Folding/a.md')!
      const editorLeaf = app.workspace.getLeaf('tab')
      await editorLeaf.openFile(file, { state: { mode: 'source' } })
      const editor = (editorLeaf.view as MarkdownView).editor

      async function openMap(): Promise<WorkspaceLeaf> {
        app.workspace.setActiveLeaf(editorLeaf)
        app.commands.executeCommandById(`${id}:mindmapnextgen:pinned`)
        await lib.waitUntil({
          predicate: () => !!app.workspace.getLeavesOfType(viewType)[0]?.view.containerEl.querySelector('g.markmap-node circle'),
          message: 'Pinned mindmap must render',
        })
        const leaf = app.workspace.getLeavesOfType(viewType)[0]!
        let previous = ''
        let stableSince = performance.now()
        await lib.waitUntil({
          predicate: () => {
            const svg = leaf.view.containerEl.querySelector('svg.markmap')
            const snapshot = svg?.innerHTML ?? ''
            if (snapshot !== previous) {
              previous = snapshot
              stableSince = performance.now()
            }
            return !!snapshot && performance.now() - stableSince >= 300
          },
          message: 'Initial fit animation must settle before clicking a branch',
        })
        return leaf
      }
      function node(leaf: WorkspaceLeaf, label: string) {
        return Array.from(leaf.view.containerEl.querySelectorAll<SVGGElement>('g.markmap-node'))
          .find(node => node.querySelector('foreignObject')?.textContent === label)
      }
      async function fold(leaf: WorkspaceLeaf, label: string) {
        const circle = node(leaf, label)?.querySelector('circle')
        if (!circle) throw new Error(`Missing branch circle: ${label}`)
        await lib.clickElement({ element: circle as unknown as HTMLElement })
        await lib.waitUntil({ predicate: () => !node(leaf, 'Detail A') })
      }
      let map = await openMap()
      await fold(map, 'Branch A')
      app.workspace.setActiveLeaf(editorLeaf)
      editor.replaceRange('\n## Added branch\n### Added detail\n', { line: editor.lastLine() + 1, ch: 0 })
      await lib.waitUntil({
        predicate: () => !!node(map, 'Added detail') && !node(map, 'Detail A'),
        message: 'Editing must update new nodes without expanding the folded branch',
      })
      const retainedAfterEdit = !node(map, 'Detail A') && !!node(map, 'Detail B')
      map.detach()
      map = await openMap()
      await lib.waitUntil({ predicate: () => !node(map, 'Detail A') && !!node(map, 'Detail B') })
      const retainedAfterReopen = !node(map, 'Detail A')

      // The same labels in another note must not inherit a.md's folded state.
      map.detach()
      await editorLeaf.openFile(app.vault.getFileByPath('Folding/b.md')!)
      map = await openMap()
      await lib.waitUntil({ predicate: () => !!node(map, 'Detail A') })
      const otherNoteExpanded = !!node(map, 'Detail A')
      map.detach()
      await editorLeaf.openFile(file)
      await app.vault.rename(file, 'Folding/renamed.md')
      await lib.waitUntil({ predicate: async () => !!(await data()).foldingStates['Folding/renamed.md'] })
      map = await openMap()
      await lib.waitUntil({ predicate: () => !node(map, 'Detail A') && !!node(map, 'Detail B') })
      const retainedAfterRename = !node(map, 'Detail A')
      map.detach()

      await app.plugins.disablePlugin(id)
      await app.plugins.enablePlugin(id)
      await lib.waitUntil({ predicate: () => !!app.commands.commands[`${id}:mindmapnextgen:pinned`] })
      map = await openMap()
      await lib.waitUntil({ predicate: () => !node(map, 'Detail A') && !!node(map, 'Detail B') })
      const retainedAfterReload = !node(map, 'Detail A')
      const reloaded = app.plugins.plugins[id]!
      const stored = await data(reloaded)

      const menu = new obsidianModule.Menu()
      menu.setUseNativeMenu(false)
      const menuView = map.view as ItemView
      menuView.onPaneMenu(menu, 'more-options')
      menu.showAtPosition({ x: 200, y: 200 })
      await lib.waitUntil({ predicate: () => !!document.querySelector('.menu-item') })
      const reset = Array.from(document.querySelectorAll<HTMLElement>('.menu-item'))
        .find(item => item.textContent?.includes('Reset saved folding state'))
      if (!reset) throw new Error('Missing reset-folding pane menu item')
      await lib.clickElement({ element: reset })
      await lib.waitUntil({ predicate: () => !!node(map, 'Detail A') })
      await lib.waitUntil({ predicate: async () => !(await data(reloaded)).foldingStates['Folding/renamed.md'] })
      const resetExpanded = !!node(map, 'Detail A')
      const latestTextRetained = !!node(map, 'Added detail')
      map.detach()
      editorLeaf.detach()
      return {
        defaultEnabled, retainedAfterEdit, retainedAfterReopen, otherNoteExpanded,
        retainedAfterRename, retainedAfterReload, resetExpanded, latestTextRetained,
        savedPaths: Object.keys(stored.foldingStates),
      }
    },
  })
  expect(result).toEqual({
    defaultEnabled: false,
    retainedAfterEdit: true,
    retainedAfterReopen: true,
    otherNoteExpanded: true,
    retainedAfterRename: true,
    retainedAfterReload: true,
    resetExpanded: true,
    latestTextRetained: true,
    savedPaths: ['Folding/renamed.md'],
  })
})

test('remembers explicit expansion when the initial expand level collapses branches', async () => {
  const result = await evalInObsidian({
    vaultPath: getTemporaryVault().path,
    callback: async ({ app, lib }) => {
      const id = 'obsidian-mindmap-nextgen'
      const plugin = app.plugins.plugins[id]!
      if (!(await plugin.loadData() as v2).settings.rememberFolding) {
        await lib.openSettingsTab({ tabId: id })
        const row = Array.from(document.querySelectorAll<HTMLElement>('.setting-item'))
          .find(row => row.querySelector('.setting-item-name')?.textContent === 'Remember node folding')
        await lib.clickElement({ element: row!.querySelector<HTMLElement>('.checkbox-container')! })
        await lib.pressKey({ key: 'Escape' })
      }
      const file = app.vault.getFileByPath('Folding/depth.md')!
      const editorLeaf = app.workspace.getLeaf('tab')
      await editorLeaf.openFile(file, { state: { mode: 'source' } })
      app.commands.executeCommandById(`${id}:mindmapnextgen:pinned`)
      const viewType = 'mindmap-nextgen-plugin'
      let map: WorkspaceLeaf
      function node(label: string) {
        return Array.from(map.view.containerEl.querySelectorAll<SVGGElement>('g.markmap-node'))
          .find(node => node.querySelector('foreignObject')?.textContent === label)
      }
      await lib.waitUntil({ predicate: () => {
        map = app.workspace.getLeavesOfType(viewType)[0]!
        return !!map && !!node('Branch A')
      } })
      const initiallyCollapsed = !node('Detail A') && !node('Detail B')
      // A DOM click targets the branch independently of the initial fit animation.
      node('Branch A')!.querySelector('circle')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await lib.waitUntil({ predicate: () => !!node('Detail A') })
      const editor = (editorLeaf.view as MarkdownView).editor
      editor.replaceRange('\n## New branch\n### New detail\n', { line: editor.lastLine() + 1, ch: 0 })
      await lib.waitUntil({ predicate: () => !!node('New branch') })
      const retainedAfterEdit = !!node('Detail A') && !node('Detail B') && !node('New detail')
      map!.detach()
      app.workspace.setActiveLeaf(editorLeaf)
      app.commands.executeCommandById(`${id}:mindmapnextgen:pinned`)
      await lib.waitUntil({ predicate: () => {
        map = app.workspace.getLeavesOfType(viewType)[0]!
        return !!map && !!node('Detail A') && !!node('Branch B')
      } })
      const retainedAfterReopen = !!node('Detail A') && !node('Detail B')
      map!.detach()
      editorLeaf.detach()
      return { initiallyCollapsed, retainedAfterEdit, retainedAfterReopen }
    },
  })
  expect(result).toEqual({ initiallyCollapsed: true, retainedAfterEdit: true, retainedAfterReopen: true })
})
