// ============================================================
// store.ts — Zustand global editor state
// Single source of truth for all editor state
// ============================================================
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { AnyNode, Document } from '../model/types';
import { History } from '../model/history';
import { makeGroup } from '../model/defaults';

export type Tool = 'select' | 'rectangle' | 'ellipse' | 'line' | 'text' | 'pen' | 'hand';

export interface Viewport {
  zoom: number;    // 1 = 100%
  panX: number;    // screen-space offset
  panY: number;
}

export interface EditorStore {
  // ---- Document ----
  doc: Document;
  // ---- Selection ----
  selectedIds: Set<string>;
  // ---- Tool ----
  activeTool: Tool;
  // ---- Viewport ----
  viewport: Viewport;
  // ---- History ----
  history: History;
  // ---- Clipboard ----
  clipboard: AnyNode[];
  // ---- Guides ----
  showGrid: boolean;
  snapEnabled: boolean;
  // ---- Rulers ----
  showRulers: boolean;

  // ---- Actions ----
  setTool(tool: Tool): void;
  setViewport(v: Partial<Viewport>): void;
  selectIds(ids: string[], additive?: boolean): void;
  clearSelection(): void;
  addNode(node: AnyNode): void;
  updateNode(id: string, patch: Partial<AnyNode>): void;
  deleteSelected(): void;
  duplicateSelected(): void;
  bringForward(): void;
  sendBackward(): void;
  bringToFront(): void;
  sendToBack(): void;
  groupSelected(): void;
  ungroupSelected(): void;
  undo(): void;
  redo(): void;
  copySelected(): void;
  paste(): void;
  pasteInPlace(): void;
  loadDocument(doc: Document): void;
  newDocument(): void;
  reorderNode(id: string, targetId: string, position: 'before' | 'after'): void;
  toggleVisibility(id: string): void;
  toggleLock(id: string): void;
  renameNode(id: string, name: string): void;
}

function freshDoc(): Document {
  const pageId = nanoid();
  const frameId = nanoid();
  // Create a default frame / artboard
  const frameNode: AnyNode = {
    id: frameId,
    type: 'frame',
    name: 'Frame 1',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 60, y: 60, width: 1200, height: 800, rotation: 0, scaleX: 1, scaleY: 1 },
    fill: { type: 'solid', color: '#ffffff', opacity: 1 },
    stroke: { color: '#e0e0e0', width: 1, opacity: 1 },
    shadow: { x: 0, y: 0, blur: 0, spread: 0, color: '#000', opacity: 0, enabled: false },
    cornerRadius: 0,
    children: [],
  };
  const page: AnyNode = {
    id: pageId,
    type: 'page',
    name: 'Page 1',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 0, width: 0, height: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    fill: { type: 'solid', color: '#f0f0f0', opacity: 1 },
    stroke: { color: 'transparent', width: 0, opacity: 0 },
    shadow: { x: 0, y: 0, blur: 0, spread: 0, color: '#000', opacity: 0, enabled: false },
    cornerRadius: 0,
    children: [frameId],
  };
  return {
    id: nanoid(),
    name: 'Untitled',
    pages: [pageId],
    activePageId: pageId,
    nodes: { [pageId]: page, [frameId]: frameNode },
  };
}

function getPageChildren(doc: Document): string[] {
  const page = doc.nodes[doc.activePageId];
  return page?.children ?? [];
}

function setPageChildren(doc: Document, children: string[]): Document {
  return {
    ...doc,
    nodes: {
      ...doc.nodes,
      [doc.activePageId]: { ...doc.nodes[doc.activePageId], children },
    },
  };
}

export const useEditorStore = create<EditorStore>((set, get) => {
  const history = new History();

  return {
    doc: freshDoc(),
    selectedIds: new Set(),
    activeTool: 'select',
    viewport: { zoom: 1, panX: 0, panY: 0 },
    history,
    clipboard: [],
    showGrid: false,
    snapEnabled: true,
    showRulers: true,

    setTool: (tool) => set({ activeTool: tool }),

    setViewport: (v) =>
      set((s) => ({ viewport: { ...s.viewport, ...v } })),

    selectIds: (ids, additive = false) =>
      set((s) => {
        if (additive) {
          const next = new Set(s.selectedIds);
          ids.forEach((id) => (next.has(id) ? next.delete(id) : next.add(id)));
          return { selectedIds: next };
        }
        return { selectedIds: new Set(ids) };
      }),

    clearSelection: () => set({ selectedIds: new Set() }),

    addNode: (node) => {
      const { doc, history } = get();
      const children = getPageChildren(doc);
      history.push({
        label: `Add ${node.name}`,
        execute() {
          set((s) => ({
            doc: setPageChildren(
              { ...s.doc, nodes: { ...s.doc.nodes, [node.id]: node } },
              [...getPageChildren(s.doc), node.id]
            ),
            selectedIds: new Set([node.id]),
          }));
        },
        undo() {
          set((s) => {
            const nodes = { ...s.doc.nodes };
            delete nodes[node.id];
            return {
              doc: setPageChildren({ ...s.doc, nodes }, children),
              selectedIds: new Set(),
            };
          });
        },
      });
    },

    updateNode: (id, patch) => {
      const { doc, history } = get();
      const prev = doc.nodes[id];
      if (!prev) return;
      const next = { ...prev, ...patch } as AnyNode;
      history.push({
        label: 'Update property',
        execute() {
          set((s) => ({ doc: { ...s.doc, nodes: { ...s.doc.nodes, [id]: next } } }));
        },
        undo() {
          set((s) => ({ doc: { ...s.doc, nodes: { ...s.doc.nodes, [id]: prev } } }));
        },
      });
    },

    deleteSelected: () => {
      const { doc, selectedIds, history } = get();
      if (selectedIds.size === 0) return;
      const ids = [...selectedIds];
      const children = getPageChildren(doc);
      const prevNodes = { ...doc.nodes };
      history.push({
        label: `Delete ${ids.length} item(s)`,
        execute() {
          set((s) => {
            const nodes = { ...s.doc.nodes };
            ids.forEach((id) => delete nodes[id]);
            return {
              doc: setPageChildren({ ...s.doc, nodes }, children.filter((c) => !ids.includes(c))),
              selectedIds: new Set(),
            };
          });
        },
        undo() {
          set((s) => ({
            doc: setPageChildren({ ...s.doc, nodes: { ...s.doc.nodes, ...prevNodes } }, children),
            selectedIds: new Set(ids),
          }));
        },
      });
    },

    duplicateSelected: () => {
      const { doc, selectedIds } = get();
      const ids = [...selectedIds];
      ids.forEach((id) => {
        const node = doc.nodes[id];
        if (!node) return;
        const dup: AnyNode = {
          ...JSON.parse(JSON.stringify(node)),
          id: nanoid(),
          name: node.name + ' copy',
          transform: { ...node.transform, x: node.transform.x + 20, y: node.transform.y + 20 },
        };
        get().addNode(dup);
      });
    },

    bringForward: () => {
      const { doc, selectedIds, history } = get();
      const id = [...selectedIds][0];
      if (!id) return;
      const children = [...getPageChildren(doc)];
      const idx = children.indexOf(id);
      if (idx < children.length - 1) {
        const prevChildren = [...children];
        [children[idx], children[idx + 1]] = [children[idx + 1], children[idx]];
        history.push({
          label: 'Bring Forward',
          execute() { set((s) => ({ doc: setPageChildren(s.doc, children) })); },
          undo() { set((s) => ({ doc: setPageChildren(s.doc, prevChildren) })); },
        });
      }
    },

    sendBackward: () => {
      const { doc, selectedIds, history } = get();
      const id = [...selectedIds][0];
      if (!id) return;
      const children = [...getPageChildren(doc)];
      const idx = children.indexOf(id);
      if (idx > 0) {
        const prevChildren = [...children];
        [children[idx], children[idx - 1]] = [children[idx - 1], children[idx]];
        history.push({
          label: 'Send Backward',
          execute() { set((s) => ({ doc: setPageChildren(s.doc, children) })); },
          undo() { set((s) => ({ doc: setPageChildren(s.doc, prevChildren) })); },
        });
      }
    },

    bringToFront: () => {
      const { doc, selectedIds, history } = get();
      const id = [...selectedIds][0];
      if (!id) return;
      const children = getPageChildren(doc).filter((c) => c !== id);
      const prevChildren = getPageChildren(doc);
      history.push({
        label: 'Bring to Front',
        execute() { set((s) => ({ doc: setPageChildren(s.doc, [...children, id]) })); },
        undo() { set((s) => ({ doc: setPageChildren(s.doc, prevChildren) })); },
      });
    },

    sendToBack: () => {
      const { doc, selectedIds, history } = get();
      const id = [...selectedIds][0];
      if (!id) return;
      const children = getPageChildren(doc).filter((c) => c !== id);
      const prevChildren = getPageChildren(doc);
      history.push({
        label: 'Send to Back',
        execute() { set((s) => ({ doc: setPageChildren(s.doc, [id, ...children]) })); },
        undo() { set((s) => ({ doc: setPageChildren(s.doc, prevChildren) })); },
      });
    },

    groupSelected: () => {
      const { doc, selectedIds, history } = get();
      if (selectedIds.size < 2) return;
      const ids = [...selectedIds];
      const group = makeGroup(ids);
      const children = getPageChildren(doc);
      const prevChildren = [...children];
      history.push({
        label: 'Group',
        execute() {
          set((s) => {
            const c = getPageChildren(s.doc).filter((id) => !ids.includes(id));
            return {
              doc: setPageChildren({ ...s.doc, nodes: { ...s.doc.nodes, [group.id]: group } }, [...c, group.id]),
              selectedIds: new Set([group.id]),
            };
          });
        },
        undo() {
          set((s) => {
            const nodes = { ...s.doc.nodes };
            delete nodes[group.id];
            return { doc: setPageChildren({ ...s.doc, nodes }, prevChildren), selectedIds: new Set(ids) };
          });
        },
      });
    },

    ungroupSelected: () => {
      const { doc, selectedIds, history } = get();
      const id = [...selectedIds][0];
      if (!id) return;
      const group = doc.nodes[id];
      if (!group || group.type !== 'group') return;
      const children = group.children ?? [];
      const pageChildren = getPageChildren(doc);
      const prevPage = [...pageChildren];
      history.push({
        label: 'Ungroup',
        execute() {
          set((s) => {
            const nodes = { ...s.doc.nodes };
            delete nodes[id];
            const c = getPageChildren(s.doc).filter((x) => x !== id);
            return { doc: setPageChildren({ ...s.doc, nodes }, [...c, ...children]), selectedIds: new Set(children) };
          });
        },
        undo() {
          set((s) => ({ doc: setPageChildren({ ...s.doc, nodes: { ...s.doc.nodes, [id]: group } }, prevPage), selectedIds: new Set([id]) }));
        },
      });
    },

    undo: () => {
      get().history.undo();
      set({}); // trigger re-render
    },

    redo: () => {
      get().history.redo();
      set({});
    },

    copySelected: () => {
      const { doc, selectedIds } = get();
      const nodes = [...selectedIds].map((id) => doc.nodes[id]).filter(Boolean) as AnyNode[];
      set({ clipboard: nodes.map((n) => JSON.parse(JSON.stringify(n))) });
    },

    paste: () => {
      const { clipboard } = get();
      clipboard.forEach((n) => {
        const dup: AnyNode = {
          ...JSON.parse(JSON.stringify(n)),
          id: nanoid(),
          name: n.name + ' copy',
          transform: { ...n.transform, x: n.transform.x + 20, y: n.transform.y + 20 },
        };
        get().addNode(dup);
      });
    },

    pasteInPlace: () => {
      const { clipboard } = get();
      clipboard.forEach((n) => {
        const dup: AnyNode = { ...JSON.parse(JSON.stringify(n)), id: nanoid(), name: n.name + ' copy' };
        get().addNode(dup);
      });
    },

    loadDocument: (doc) => set({ doc, selectedIds: new Set() }),

    newDocument: () => set({ doc: freshDoc(), selectedIds: new Set() }),

    reorderNode: (id, targetId, position) => {
      const { doc, history } = get();
      const children = [...getPageChildren(doc)];
      const prevChildren = [...children];
      const from = children.indexOf(id);
      if (from < 0) return;
      children.splice(from, 1);
      let to = children.indexOf(targetId);
      if (position === 'after') to += 1;
      children.splice(Math.max(0, to), 0, id);
      history.push({
        label: 'Reorder',
        execute() { set((s) => ({ doc: setPageChildren(s.doc, children) })); },
        undo() { set((s) => ({ doc: setPageChildren(s.doc, prevChildren) })); },
      });
    },

    toggleVisibility: (id) => {
      const { doc } = get();
      const node = doc.nodes[id];
      if (!node) return;
      set((s) => ({ doc: { ...s.doc, nodes: { ...s.doc.nodes, [id]: { ...node, visible: !node.visible } } } }));
    },

    toggleLock: (id) => {
      const { doc } = get();
      const node = doc.nodes[id];
      if (!node) return;
      set((s) => ({ doc: { ...s.doc, nodes: { ...s.doc.nodes, [id]: { ...node, locked: !node.locked } } } }));
    },

    renameNode: (id, name) => {
      const { doc } = get();
      const node = doc.nodes[id];
      if (!node) return;
      set((s) => ({ doc: { ...s.doc, nodes: { ...s.doc.nodes, [id]: { ...node, name } } } }));
    },
  };
});
