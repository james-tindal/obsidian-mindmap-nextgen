import { beforeEach, expect, it, vi } from 'vitest'
import type { IPureNode } from 'markmap-common'
import type { Component, TFile } from 'obsidian'
import type { MindmapTab } from 'src/utilities/types'
import { captureFolding, FoldingState, restoreFolding } from './folding'

const mocks = vi.hoisted(() => ({
  settings: { rememberFolding: false, initialExpandLevel: -1, titleAsRootNode: false },
  saved: {} as Record<string, FoldingState>,
  read: vi.fn(),
  map: undefined as any,
  save: vi.fn(),
}))
vi.mock('src/settings/filesystem', () => ({
  globalSettings: mocks.settings,
  foldingStates: {
    load: (path: string) => mocks.saved[path],
    save: (path: string, root: IPureNode) => {
      mocks.save(path)
      mocks.saved[path] = captureFolding(root)
    },
    reset: (path: string) => { delete mocks.saved[path] },
  },
}))
vi.mock('src/rendering/screenshot', () => ({ takeScreenshot: vi.fn() }))
vi.mock('src/internal-links/handle-internal-links', () => ({ registerInternalLinks: vi.fn() }))
vi.mock('./renderer-common', () => ({
  createMarkmap: () => ({ svg: {}, markmap: mocks.map, toolbar: { hidden: false } }),
  transformMarkdown: (markdown: string) => JSON.parse(markdown),
  splitMarkdown: () => ({ settings: {} }),
  getOptions: (settings: any) => ({ initialExpandLevel: settings.initialExpandLevel }),
}))

import { TabRenderer } from './renderer-tab'

const note = (path: string) => ({ path, basename: path.replace('.md', '') }) as TFile
const markdown = (suffix = '') => JSON.stringify({ content: 'Root', children: [
  { content: 'A', children: [{ content: `A detail${suffix}` }] },
  { content: 'B', children: [{ content: 'B detail' }] },
] })

function renderer() {
  const cleanup: (() => void)[] = []
  const component = { register: (callback: () => void) => cleanup.push(callback) } as unknown as Component
  const container = { children: [{}, {}] } as unknown as MindmapTab.View['containerEl']
  return { view: TabRenderer(container, component), close: () => cleanup.forEach(callback => callback()) }
}

beforeEach(() => {
  mocks.settings.rememberFolding = false
  mocks.settings.initialExpandLevel = -1
  mocks.saved = {}
  mocks.save.mockClear()
  mocks.read.mockReset().mockResolvedValue(markdown())
  vi.stubGlobal('app', { vault: { cachedRead: mocks.read } })
  mocks.map = {
    state: { data: undefined },
    setData: vi.fn(async function(this: any, root: IPureNode, options: any) {
      // Model Markmap's initial depth rules; the real renderer is tested in Obsidian.
      restoreFolding(root, options.initialExpandLevel)
      this.state.data = root
    }),
    toggleNode: vi.fn(async function(this: any, node: IPureNode, recursive = false) {
      const folded = node.payload?.fold ? 0 : 1
      function toggle(current: IPureNode) {
        current.payload = { ...current.payload, fold: folded }
        if (recursive) current.children?.forEach(toggle)
      }
      toggle(node)
    }),
    fit: vi.fn(),
  }
})

it('preserves the original rendering behavior and does not save while disabled', async () => {
  const { view } = renderer()
  await view.firstRender(note('a.md'))
  await mocks.map.toggleNode(mocks.map.state.data.children[0])
  await view.render(note('a.md'), markdown(' edited'))
  expect(mocks.map.state.data.children[0].payload?.fold).toBeUndefined()
  expect(mocks.save).not.toHaveBeenCalled()
})

it('remembers folds across edits, note switches, close/reopen and resetting', async () => {
  mocks.settings.rememberFolding = true
  const { view, close } = renderer()
  await view.firstRender(note('a.md'))
  await mocks.map.toggleNode(mocks.map.state.data.children[0], true)
  await view.render(note('a.md'), markdown(' edited'))
  expect(mocks.map.state.data.children[0].payload.fold).toBe(1)
  await view.render(note('b.md'), markdown())
  expect(mocks.map.state.data.children[0].payload?.fold).toBeUndefined()
  close()
  const reopened = renderer().view
  await reopened.firstRender(note('a.md'))
  expect(mocks.map.state.data.children[0].payload.fold).toBe(1)
  await reopened.resetFolding()
  expect(mocks.map.state.data.children[0].payload?.fold).toBeUndefined()
  expect(mocks.saved['a.md']).toBeUndefined()
})

it('restores expanded nodes even with a limited initial expansion depth', async () => {
  mocks.settings.rememberFolding = true
  mocks.settings.initialExpandLevel = 2
  const { view } = renderer()
  await view.firstRender(note('a.md'))
  await mocks.map.toggleNode(mocks.map.state.data.children[0])
  await view.render(note('a.md'), markdown())
  expect(mocks.map.state.data.children[0].payload.fold).toBe(0)
  expect(mocks.map.state.data.children[1].payload.fold).toBe(1)
})

it('persists collapse-all and resets using the latest unsaved editor content', async () => {
  mocks.settings.rememberFolding = true
  const { view } = renderer()
  await view.firstRender(note('a.md'))
  await view.render(note('a.md'), markdown(' unsaved'))
  await view.collapseAll()
  expect(mocks.saved['a.md']['[]']).toBe(true)
  await view.resetFolding()
  expect(mocks.map.state.data.children[0].children[0].content).toBe('A detail unsaved')
})

it('ignores stale disk reads when a newer editor render or note switch arrives', async () => {
  const { view } = renderer()
  await view.firstRender(note('a.md'))
  let finish!: (value: string) => void
  mocks.read.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
  const stale = view.render(note('a.md'))
  await view.render(note('b.md'), markdown(' newest'))
  finish(markdown(' stale'))
  await stale
  expect(mocks.map.state.data.children[0].children[0].content).toBe('A detail newest')
})
