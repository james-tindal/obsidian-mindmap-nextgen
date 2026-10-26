import type { View, WorkspaceLeaf } from 'obsidian'
import { afterEach, expect, test } from 'vitest'
import { evalInObsidian } from 'obsidian-integration-testing'
import { getTemporaryVault } from 'obsidian-integration-testing/vitest-global-setup-plugin'

type CanvasView = View & {
  canvas: {
    scale: number
    setViewport(x: number, y: number, zoom: number): void
    nodes: Map<string, { resize(size: { width: number, height: number }): void }>
  }
}
type Surface = 'canvas' | 'embed' | 'hover'

async function openFixture(path: string, mode = 'preview', zoom = 0) {
  await evalInObsidian({
    vaultPath: getTemporaryVault().path,
    input: { path, mode, zoom },
    callback: async ({ app, lib, path, mode, zoom }) => {
      const file = app.vault.getFileByPath(path)
      if (!file) throw new Error(`Missing fixture: ${path}`)
      const leaf = app.workspace.getLeaf(false)
      await leaf.openFile(file, { state: { mode } })
      app.workspace.setActiveLeaf(leaf)
      if (leaf.view.getViewType() === 'canvas') {
        const { canvas } = leaf.view as CanvasView
        canvas.setViewport(250, 180, zoom)
        await lib.waitUntil({
          predicate: () => Math.abs(canvas.scale - 2 ** zoom) < 0.001,
          message: `Canvas zoom must reach ${zoom}`,
        })
      }
    },
  })
}

async function openSurface(surface: Surface) {
  if (surface === 'canvas') return openFixture('Host/file.canvas')
  if (surface === 'embed') return openFixture('Host/embed.md')
  await openFixture('Host/hover.md')
  await evalInObsidian({
    vaultPath: getTemporaryVault().path,
    callback: async ({ app, lib }) => {
      const leaf = app.workspace.getMostRecentLeaf()
      if (!leaf) throw new Error('Missing hover host view')
      await lib.waitUntil({
        predicate: () => Array.from(leaf.view.containerEl.querySelectorAll('a.internal-link'))
          .some(link => link.getBoundingClientRect().width > 0),
        message: 'Hover host link must render',
      })
      const link = Array.from(leaf.view.containerEl.querySelectorAll<HTMLAnchorElement>('a.internal-link'))
        .find(link => link.getBoundingClientRect().width > 0)
      if (!link) throw new Error('Missing visible hover host link')
      await lib.hoverElement({ element: link })
    },
  })
}

async function measureMap(surface: Surface = 'canvas') {
  return evalInObsidian({
    vaultPath: getTemporaryVault().path,
    input: { surface },
    callback: async ({ app, lib, surface }) => {
      const scope = surface === 'hover'
        ? document.querySelector('.hover-popover')
        : app.workspace.getMostRecentLeaf()?.view.containerEl
      // A hover popover can appear after the pointer event completes.
      function findSvg() {
        const root = surface === 'hover' ? document.querySelector('.hover-popover') : scope
        return Array.from(root?.querySelectorAll<SVGSVGElement>('svg.markmap') ?? [])
          .find(svg => svg.getBoundingClientRect().width > 0)
      }
      let previous = ''
      let stableSince = performance.now()
      await lib.waitUntil({
        timeoutInMilliseconds: 10_000,
        message: `${surface} mindmap must finish rendering and fitting`,
        predicate: () => {
          const svg = findSvg()
          const nodes = Array.from(svg?.querySelectorAll<SVGForeignObjectElement>('g.markmap-node foreignObject') ?? [])
          if (!svg || !svg.querySelector(':scope > g')?.hasAttribute('transform') || !nodes.length
            || nodes.some(node => !node.width.baseVal.value || getComputedStyle(node).opacity !== '1')) return false
          const snapshot = `${svg.clientWidth},${svg.clientHeight},${svg.innerHTML}`
          if (snapshot !== previous) {
            previous = snapshot
            stableSince = performance.now()
          }
          return performance.now() - stableSince >= 400
        },
      })
      const svg = findSvg()
      const group = svg?.querySelector<SVGGElement>(':scope > g')
      if (!svg || !group) throw new Error(`Missing ${surface} mindmap`)
      const box = svg.getBoundingClientRect()
      const content = group.getBoundingClientRect()
      return {
        nodes: svg.querySelectorAll('g.markmap-node').length,
        text: svg.textContent,
        colors: Array.from(svg.querySelectorAll('g.markmap-node > line')).map(line => line.getAttribute('stroke')),
        width: svg.clientWidth,
        widthRatio: content.width / box.width,
        heightRatio: content.height / box.height,
        centerX: (content.x - box.x + content.width / 2) / box.width,
        centerY: (content.y - box.y + content.height / 2) / box.height,
      }
    },
  })
}

function expectFitted(map: Awaited<ReturnType<typeof measureMap>>) {
  expect(Math.max(map.widthRatio, map.heightRatio)).toBeGreaterThan(0.9)
  expect(Math.max(map.widthRatio, map.heightRatio)).toBeLessThan(1.05)
  expect(Math.abs(map.centerX - 0.5)).toBeLessThan(0.03)
  expect(Math.abs(map.centerY - 0.5)).toBeLessThan(0.03)
}

afterEach(async () => {
  await evalInObsidian({
    vaultPath: getTemporaryVault().path,
    callback: async ({ app, lib }) => {
      await lib.pressKey({ key: 'Escape' })
      const leaves: WorkspaceLeaf[] = []
      app.workspace.iterateRootLeaves(leaf => { leaves.push(leaf) })
      for (const leaf of leaves) leaf.detach()
      await lib.moveMouse({ x: 0, y: 0 })
      await lib.waitUntil({
        predicate: () => !document.querySelector('.hover-popover'),
        message: 'Hover popovers must close before the next test',
      })
    },
  })
})

test.each(['file', 'text'])('renders a mindmap in a Canvas %s card', async kind => {
  await openFixture(`Host/${kind}.canvas`)
  const map = await measureMap()
  expect(map.nodes).toBe(4)
  expect(map.text).toContain('Root')
  expect(map.text).toContain('Third')
  expectFitted(map)
})

test.each([-1, 0, 0.5])('fits a Canvas card initially rendered at zoom %s', async zoom => {
  await openFixture('Host/file.canvas', 'preview', zoom)
  expectFitted(await measureMap())
})

test('preserves map proportions when Canvas zoom changes', async () => {
  await openFixture('Host/file.canvas')
  const original = await measureMap()
  for (const zoom of [-1, 0.5, 0]) {
    await evalInObsidian({
      vaultPath: getTemporaryVault().path,
      input: { zoom },
      callback: async ({ app, lib, zoom }) => {
        const leaf = app.workspace.getMostRecentLeaf()
        if (!leaf) throw new Error('Missing Canvas view')
        const { canvas } = leaf.view as CanvasView
        canvas.setViewport(250, 180, zoom)
        await lib.waitUntil({ predicate: () => Math.abs(canvas.scale - 2 ** zoom) < 0.001 })
      },
    })
    const map = await measureMap()
    expect(map.widthRatio).toBeCloseTo(original.widthRatio, 2)
    expect(map.heightRatio).toBeCloseTo(original.heightRatio, 2)
    expectFitted(map)
  }
})

test('refits after a Canvas card is resized', async () => {
  await openFixture('Host/file.canvas')
  const original = await measureMap()
  await evalInObsidian({
    vaultPath: getTemporaryVault().path,
    callback: ({ app }) => {
      const leaf = app.workspace.getMostRecentLeaf()
      if (!leaf) throw new Error('Missing Canvas view')
      const node = (leaf.view as CanvasView).canvas.nodes.get('map')
      if (!node) throw new Error('Missing Canvas card')
      node.resize({ width: 300, height: 360 })
    },
  })
  const resized = await measureMap()
  expect(resized.width).toBeLessThan(original.width - 150)
  expectFitted(resized)
})

test.each(['preview', 'source'])('renders an embedded mindmap in %s mode', async mode => {
  await openFixture('Host/embed.md', mode)
  const map = await measureMap('embed')
  expect(map.nodes).toBe(4)
  expect(map.text).toContain('Third')
  expectFitted(map)
})

test('renders a mindmap in a hover preview', async () => {
  await openSurface('hover')
  const map = await measureMap('hover')
  expect(map.nodes).toBe(4)
  expect(map.text).toContain('Third')
  expectFitted(map)
})

test.each<Surface>(['canvas', 'embed', 'hover'])('uses source-note settings in a %s', async surface => {
  await openSurface(surface)
  const map = await measureMap(surface)
  expect(map.colors).toEqual(Array(4).fill('#123456'))
})

test.each<Surface>(['canvas', 'embed', 'hover'])('resolves relative links from the source note in a %s', async surface => {
  await openSurface(surface)
  await measureMap(surface)
  const openedPath = await evalInObsidian({
    vaultPath: getTemporaryVault().path,
    input: { surface },
    callback: async ({ app, lib, surface }) => {
      const scope = surface === 'hover'
        ? document.querySelector('.hover-popover')
        : app.workspace.getMostRecentLeaf()?.view.containerEl
      const link = Array.from(scope?.querySelectorAll<HTMLAnchorElement>('svg.markmap a[href="target"]') ?? [])
        .find(link => link.getBoundingClientRect().width > 0)
      if (!link) throw new Error(`Missing relative link in ${surface}`)
      if (surface === 'canvas') {
        const blocker = scope?.querySelector<HTMLElement>('.canvas-node-content-blocker')
        if (!blocker) throw new Error('Missing Canvas card interaction blocker')
        await lib.clickElement({ element: blocker })
        await lib.waitUntil({
          predicate: () => {
            const rect = link.getBoundingClientRect()
            return link.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2))
          },
          message: 'Canvas card must allow pointer input to the link',
        })
      }
      await lib.clickElement({ element: link })
      await lib.waitUntil({
        predicate: () => app.workspace.getActiveFile()?.name === 'target.md',
        message: `Clicking the ${surface} mindmap link must open a target note`,
      })
      return app.workspace.getActiveFile()?.path
    },
  })
  expect(openedPath).toBe('Source/target.md')
})
