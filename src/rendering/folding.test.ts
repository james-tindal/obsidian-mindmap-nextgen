import { describe, expect, it } from 'vitest'
import type { IPureNode } from 'markmap-common'
import { captureFolding, moveFoldingStates, parseFoldingStates, restoreFolding } from './folding'

const leaf = (content: string): IPureNode => ({ content, children: [] })
const branch = (content: string, children = [leaf(`${content} detail`)]): IPureNode => ({ content, children })
const tree = (...children: IPureNode[]): IPureNode => ({ content: 'Root', children })
const folded = (node: IPureNode, fold = 1) => {
  node.payload = { ...node.payload, fold }
  return node
}

describe('saved node folding', () => {
  it('restores both folded and explicitly expanded branches after serialization', () => {
    const original = tree(folded(branch('A')), folded(branch('B'), 0))
    const saved = JSON.parse(JSON.stringify(captureFolding(original)))
    const updated = tree(branch('B'), branch('New'), branch('A'))
    restoreFolding(updated, 2, saved)
    expect(updated.children!.map(node => node.payload?.fold)).toEqual([0, 1, 1])
    expect(updated.payload?.fold).toBe(0)
  })

  it('keeps states of hidden descendants when an ancestor is collapsed', () => {
    const original = folded(tree(folded(branch('A', [folded(branch('Nested'))]))))
    const updated = tree(branch('A', [branch('Nested')]))
    restoreFolding(updated, -1, captureFolding(original))
    expect(updated.payload?.fold).toBe(1)
    expect(updated.children![0].children![0].payload?.fold).toBe(1)
  })

  it('does not give removed or renamed branches states to unrelated replacements', () => {
    const original = tree(folded(branch('A')), folded(branch('B')))
    const updated = tree(branch('Renamed'), branch('B'), branch('New'))
    restoreFolding(updated, -1, captureFolding(original))
    expect(updated.children!.map(node => !!node.payload?.fold)).toEqual([false, true, false])
  })

  it('distinguishes duplicate siblings and invalidates them when their count changes', () => {
    const original = tree(folded(branch('Same')), branch('Same'))
    const saved = captureFolding(original)
    const unchanged = tree(branch('Same'), branch('Same'))
    restoreFolding(unchanged, -1, saved)
    expect(unchanged.children!.map(node => !!node.payload?.fold)).toEqual([true, false])
    const changed = tree(branch('Same'), branch('Same'), branch('Same'))
    restoreFolding(changed, -1, saved)
    expect(changed.children!.map(node => !!node.payload?.fold)).toEqual([false, false, false])
  })

  it('retains initial-depth and recursive-comment defaults for new nodes', () => {
    const root = tree(folded(branch('Comment', [branch('Nested')]), 2), branch('Other'))
    restoreFolding(root, -1)
    expect(root.children![0].payload?.fold).toBe(1)
    expect(root.children![0].children![0].payload?.fold).toBe(1)
    expect(root.children![1].payload?.fold).toBeUndefined()
    const saved = captureFolding(tree(branch('Comment', [branch('Nested')]), branch('Other')))
    restoreFolding(root, 0, saved)
    expect(root.children![0].payload?.fold).toBe(0)
    expect(root.children![0].children![0].payload?.fold).toBe(0)
  })

  it('keeps a root state when the filename used as its title changes', () => {
    const saved = captureFolding(folded(tree(branch('A'))))
    const renamed = { ...tree(branch('A')), content: 'Renamed file' }
    restoreFolding(renamed, -1, saved)
    expect(renamed.payload?.fold).toBe(1)
  })

  it('ignores malformed saved data', () => {
    expect(parseFoldingStates(null)).toEqual({})
    expect(parseFoldingStates([])).toEqual({})
    expect(parseFoldingStates({ 'a.md': { '[]': true, invalid: 2 }, 'b.md': [], 'c.md': null }))
      .toEqual({ 'a.md': { '[]': true } })
  })

  it('migrates folder descendants and removes only deleted paths', () => {
    const states = { 'Folder/a.md': { '[]': true }, 'Folder/b.md': { '[]': false }, 'Folders/c.md': { '[]': true } }
    moveFoldingStates(states, 'Folder', 'Renamed')
    expect(Object.keys(states).sort()).toEqual(['Folders/c.md', 'Renamed/a.md', 'Renamed/b.md'])
    moveFoldingStates(states, 'Renamed/a.md')
    expect(Object.keys(states).sort()).toEqual(['Folders/c.md', 'Renamed/b.md'])
    moveFoldingStates(states, 'Renamed')
    expect(Object.keys(states)).toEqual(['Folders/c.md'])
  })
})
