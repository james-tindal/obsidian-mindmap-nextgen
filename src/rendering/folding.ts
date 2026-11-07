import type { IPureNode } from 'markmap-common'

export type FoldingState = Record<string, boolean>

// Markmap's IDs depend on traversal order. Use content paths instead, so inserting
// or reordering unrelated siblings does not move a saved state to another node.
// Include duplicate counts: when identical siblings are added/removed, discard
// their ambiguous states rather than applying them to a different occurrence.
function visit(root: IPureNode, callback: (node: IPureNode, key: string) => void) {
  function walk(node: IPureNode, path: unknown[]) {
    callback(node, JSON.stringify(path))
    const counts = new Map<string, number>()
    const occurrences = new Map<string, number>()
    const identity = (child: IPureNode) => JSON.stringify([child.payload?.tag, child.content])
    for (const child of node.children ?? []) {
      const id = identity(child)
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
    for (const child of node.children ?? []) {
      const id = identity(child)
      const occurrence = occurrences.get(id) ?? 0
      occurrences.set(id, occurrence + 1)
      walk(child, [...path, [id, occurrence, counts.get(id)]])
    }
  }
  walk(root, [])
}

export function captureFolding(root: IPureNode): FoldingState {
  const result: FoldingState = {}
  visit(root, (node, key) => {
    if (node.children?.length) result[key] = !!node.payload?.fold
  })
  return result
}

// Materialize Markmap's initial folding rules before restoring the saved state.
// Pass initialExpandLevel: -1 to setData afterwards, otherwise Markmap would
// collapse explicitly expanded nodes again. Normalize recursive fold comments
// (fold: 2) as well, so they cannot overwrite restored descendant states.
export function restoreFolding(root: IPureNode, initialExpandLevel: number, saved?: FoldingState) {
  function initialize(node: IPureNode, depth: number, recursive = false) {
    const foldChildren = recursive || node.payload?.fold === 2
    if (foldChildren || (initialExpandLevel >= 0 && depth >= initialExpandLevel))
      node.payload = { ...node.payload, fold: 1 }
    for (const child of node.children ?? []) initialize(child, depth + 1, foldChildren)
  }
  initialize(root, 1)
  if (saved) visit(root, (node, key) => {
    if (node.children?.length && Object.prototype.hasOwnProperty.call(saved, key))
      node.payload = { ...node.payload, fold: saved[key] ? 1 : 0 }
  })
}

export function parseFoldingStates(data: unknown): Record<string, FoldingState> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
  return Object.fromEntries(Object.entries(data).flatMap(([path, value]) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return []
    const entries = Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean')
    return entries.length ? [[path, Object.fromEntries(entries)]] : []
  }))
}

// Folder events have to migrate/remove their descendants too.
export function moveFoldingStates(states: Record<string, FoldingState>, oldPath: string, newPath?: string) {
  let changed = false
  for (const path of Object.keys(states)) {
    if (path !== oldPath && !path.startsWith(`${oldPath}/`)) continue
    const state = states[path]
    changed = true
    delete states[path]
    if (newPath !== undefined) states[newPath + path.slice(oldPath.length)] = state
  }
  return changed
}
