import { MarkdownPostProcessorContext, MarkdownRenderChild, WorkspaceLeaf, WorkspaceParent, WorkspaceSplit, WorkspaceTabs as TabGroup } from "obsidian";

import { PluginSettings } from "src/filesystem";
import { InlineRenderer } from "src/rendering/renderer-inline";
import { FindSet, nextTick } from "src/utilities";


const inlineRenderers = InlineRenderers();
const fitAllRenderersInLeaf = (leaf: WorkspaceLeaf) => {
  return inlineRenderers.get(leaf)?.forEach(ir => ir.fit())
}

const leaves = DiffSet<WorkspaceLeaf>({ added: inlineRenderers.addLeaf });
const currentLeaves = DiffSet<WorkspaceLeaf>({ added: fitAllRenderersInLeaf });      // currentLeaves are the visible tabs of each tab group

function update() {
  const tabGroups = Array.from(getTabGroups());
  leaves.update(getLeaves(tabGroups));
  currentLeaves.update(getCurrentLeaves(tabGroups));
}

app.workspace.on("layout-change", update);
app.workspace.on("active-leaf-change", update);

function renderAll() {
  inlineRenderers.forEach(ir => ir.render())
}

const handler = (settings: PluginSettings) =>
async function handler(markdown: string, containerEl: HTMLDivElement, ctx: MarkdownPostProcessorContext) {
  const childComponent = new MarkdownRenderChild(containerEl);
  ctx.addChild(childComponent);
  const renderer = InlineRenderer(markdown, containerEl, settings)
  await nextTick();     // elements aren't added to the DOM until after this function returns.
  const remove = inlineRenderers.addIR(renderer)
  childComponent.register(remove)
}

export const codeblocks = { handler, renderAll }


type InlineRenderers = ReturnType<typeof InlineRenderers>
function InlineRenderers() {
  const byIR = new Map<InlineRenderer, WorkspaceLeaf>();
  const byLeaf = ByLeaf();
  const noLeaf = new FindSet<InlineRenderer>();

  return { get: byLeaf.get, forEach, addIR, addLeaf }

  function forEach(cb: (ir: InlineRenderer) => void) {
    byIR.forEach((_, ir) => cb(ir))
  }

  function addLeaf(leaf: WorkspaceLeaf) {
    const irs = noLeaf.filter(ir => leaf.containerEl.contains(ir.containerEl));

    irs.forEach(ir => {
      noLeaf.delete(ir);
      byLeaf.add(leaf, ir);
      byIR.set(ir, leaf);
    })
  }

  function addIR(ir: InlineRenderer) {
    const parentLeaf = leaves.find(leaf => leaf.containerEl.contains(ir.containerEl));

    if (parentLeaf) {
      byIR.set(ir, parentLeaf);
      byLeaf.add(parentLeaf, ir);

      if (currentLeaves.has(parentLeaf)) ir.fit();

      return function remove() {
        byIR.delete(ir);
        byLeaf.delete(parentLeaf, ir)
      }
    } else {
      noLeaf.add(ir);

      return function remove() {
        noLeaf.delete(ir);
        const leaf = byIR.get(ir);
        if (leaf) {
          byLeaf.delete(leaf, ir);
          byIR.delete(ir);
        }
      }
    }
  }
}

function ByLeaf() {
  const map = new Map<WorkspaceLeaf, Set<InlineRenderer>>();
  const get = (leaf: WorkspaceLeaf) => map.get(leaf);

  return { add, delete: _delete, get }

  function add(leaf: WorkspaceLeaf, ir: InlineRenderer) {
    if (map.has(leaf))
      map.get(leaf)!.add(ir)
    else
      map.set(leaf, new FindSet([ir]))
  }

  function _delete(leaf: WorkspaceLeaf, ir: InlineRenderer) {
    const set = map.get(leaf);
    set?.delete?.(ir);
    set?.size === 0 && map.delete(leaf);
  }
}

function DiffSet<T>(cbs: { removed?: (v: T) => void, added?: (v: T) => void } = {}) {
  let set = new FindSet<T>();

  return { update,
    get values() { return set.values },
    get has() { return set.has },
    get find() { return set.find }
  }

  function update(iterable: Iterable<T>) {
    const newSet = new FindSet(iterable);
    diff<T>(set, newSet, { notInA: cbs?.added, notInB: cbs?.removed })
    set = newSet;
  }
}


function diff<T>(a: Set<T>, b: Set<T>, cbs: { notInA?: (v: T) => void, notInB?: (v: T) => void }) {
  for (const x of union(a, b)) {
    if (!a.has(x)) cbs.notInA?.(x);
    if (!b.has(x)) cbs.notInB?.(x);
  }
}

function* union<T>(a: Set<T>, b: Set<T>) {
  yield* a;
  for (const x of b)
    if (!a.has(x)) yield x;
}


function* getTabGroups(parent: WorkspaceParent = app.workspace.rootSplit.children[0]): Generator<TabGroup> {
  if (isSplit(parent))
    for (const child of parent.children)
      yield* getTabGroups(child);
  if (isTabGroup(parent))
    yield parent;
}

function* getCurrentLeaves(tabGroups: Iterable<TabGroup>) {
  for (const group of tabGroups) {
    yield group.children[group.currentTab]
  }
}

function* getLeaves(tabGroups: Iterable<TabGroup>): Generator<WorkspaceLeaf, void, undefined> {
  for (const group of tabGroups)
    yield* group.children
}

function isTabGroup(parent: WorkspaceParent): parent is TabGroup {
  return parent.type === "tabs";
}

function isSplit(parent: WorkspaceParent): parent is WorkspaceSplit {
  return parent.type === "split";
}
