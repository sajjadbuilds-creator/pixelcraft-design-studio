// ============================================================
// Canvas.tsx — The main drawing surface
// Handles: viewport transform, tool interactions,
//          selection, resize, rotate, draw shapes, pen tool
// ============================================================
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Renderer } from '../engine/renderer';
import { hitTestAll, hitTestArea, hitTestHandle } from '../engine/hitTest';
import { computeSnap } from '../engine/snapping';
import { computeRotatedResize } from '../engine/math';
import { useEditorStore } from '../store/editorStore';
import type { AnyNode } from '../model/types';
import { makeRect, makeEllipse, makeLine, makeText, makePath } from '../model/defaults';
import type { HandleIndex } from '../engine/hitTest';

interface DragState {
  type: 'none' | 'pan' | 'move' | 'resize' | 'rotate' | 'marquee' | 'draw' | 'pen';
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  handle?: HandleIndex;
  nodeSnapshot?: AnyNode;
  nodesSnapshot?: AnyNode[];
}

function screenToCanvas(sx: number, sy: number, viewport: { zoom: number; panX: number; panY: number }) {
  return {
    x: (sx - viewport.panX) / viewport.zoom,
    y: (sy - viewport.panY) / viewport.zoom,
  };
}

export interface CanvasProps {
  onPointerCoords?: (x: number, y: number) => void;
}

export const Canvas: React.FC<CanvasProps> = ({ onPointerCoords }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const rafRef = useRef<number>(0);
  const dragRef = useRef<DragState>({ type: 'none', startX: 0, startY: 0, lastX: 0, lastY: 0 });
  const penPointsRef = useRef<{ x: number; y: number }[]>([]);
  const penCursorRef = useRef<{ x: number; y: number } | null>(null);
  const isSpaceDownRef = useRef(false);

  const store = useEditorStore();
  const { doc, viewport, selectedIds, activeTool, snapEnabled, showGrid } = store;

  // Snap guides (canvas-space)
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });

  // ---- Init renderer ----
  useEffect(() => {
    if (!canvasRef.current) return;
    rendererRef.current = new Renderer(canvasRef.current);
  }, []);

  // ---- Resize canvas to match container ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas.parentElement!);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    return () => ro.disconnect();
  }, []);

  // ---- RAF render loop ----
  useEffect(() => {
    const loop = () => {
      if (rendererRef.current) {
        rendererRef.current.render({
          doc,
          viewport,
          selectedIds,
          guides: { x: guides.x, y: guides.y },
          showGrid,
          penPoints: penPointsRef.current,
          penCursor: penCursorRef.current,
        });
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [doc, viewport, selectedIds, guides, showGrid]);

  // ---- Cursor management ----
  const updateCursor = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cp = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, viewport);

    if (isSpaceDownRef.current) {
      canvas.style.cursor = dragRef.current.type === 'pan' ? 'grabbing' : 'grab';
      return;
    }
    if (activeTool === 'hand') { canvas.style.cursor = 'grab'; return; }
    if (activeTool !== 'select') { canvas.style.cursor = 'crosshair'; return; }

    // Check handle hits first
    for (const id of selectedIds) {
      const node = doc.nodes[id];
      if (!node) continue;
      const h = hitTestHandle(cp.x, cp.y, node, viewport.zoom);
      if (h) {
        canvas.style.cursor = handleCursor(h, node.transform.rotation);
        return;
      }
    }
    const hit = hitTestAll(cp.x, cp.y, doc);
    canvas.style.cursor = hit ? 'move' : 'default';
  }, [activeTool, viewport, selectedIds, doc]);

  // ---- Pointer down ----
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const cp = screenToCanvas(sx, sy, viewport);

    dragRef.current = { type: 'none', startX: cp.x, startY: cp.y, lastX: cp.x, lastY: cp.y };

    // Hand tool / space panning
    if (activeTool === 'hand' || e.button === 1 || isSpaceDownRef.current) {
      dragRef.current.type = 'pan';
      dragRef.current.startX = sx;
      dragRef.current.startY = sy;
      dragRef.current.lastX = sx;
      dragRef.current.lastY = sy;
      canvas.style.cursor = 'grabbing';
      return;
    }

    // Shape draw tools
    if (activeTool !== 'select' && activeTool !== 'pen') {
      dragRef.current.type = 'draw';
      return;
    }

    // Pen tool
    if (activeTool === 'pen') {
      penPointsRef.current = [...penPointsRef.current, { x: cp.x, y: cp.y }];
      dragRef.current.type = 'pen';
      return;
    }

    // Select tool
    // Check handle on selected nodes
    for (const id of selectedIds) {
      const node = doc.nodes[id];
      if (!node) continue;
      const h = hitTestHandle(cp.x, cp.y, node, viewport.zoom);
      if (h) {
        dragRef.current.type = h === 'rotate' ? 'rotate' : 'resize';
        dragRef.current.handle = h;
        dragRef.current.nodeSnapshot = JSON.parse(JSON.stringify(node));
        return;
      }
    }

    const hitId = hitTestAll(cp.x, cp.y, doc);
    if (hitId) {
      if (!e.shiftKey && !selectedIds.has(hitId)) {
        store.selectIds([hitId]);
      } else if (e.shiftKey) {
        store.selectIds([hitId], true);
      }
      // Snapshot all currently selected for group move
      dragRef.current.type = 'move';
      dragRef.current.nodesSnapshot = [...selectedIds, ...(selectedIds.has(hitId) ? [] : [hitId])]
        .map((id) => JSON.parse(JSON.stringify(doc.nodes[id])))
        .filter(Boolean);
    } else {
      if (!e.shiftKey) store.clearSelection();
      dragRef.current.type = 'marquee';
    }
  }, [activeTool, viewport, selectedIds, doc, store]);

  // ---- Pointer move ----
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const cp = screenToCanvas(sx, sy, viewport);
    const drag = dragRef.current;

    updateCursor(e as any);
    onPointerCoords?.(Math.round(cp.x), Math.round(cp.y));

    if (activeTool === 'pen') {
      penCursorRef.current = cp;
      return;
    }

    if (drag.type === 'none') return;

    if (drag.type === 'pan') {
      const dx = sx - drag.lastX;
      const dy = sy - drag.lastY;
      store.setViewport({ panX: viewport.panX + dx, panY: viewport.panY + dy });
      dragRef.current.lastX = sx;
      dragRef.current.lastY = sy;
      return;
    }

    if (drag.type === 'move') {
      const dx = cp.x - drag.lastX;
      const dy = cp.y - drag.lastY;
      dragRef.current.lastX = cp.x;
      dragRef.current.lastY = cp.y;
      const moveIds = [...selectedIds];
      moveIds.forEach((id) => {
        const node = doc.nodes[id];
        if (!node || node.locked) return;
        let nx = node.transform.x + dx;
        let ny = node.transform.y + dy;
        if (snapEnabled && moveIds.length === 1) {
          const snap = computeSnap(id, nx, ny, node.transform.width, node.transform.height, doc);
          nx = snap.x; ny = snap.y;
          setGuides({ x: snap.guideX, y: snap.guideY });
        }
        // Direct mutation during drag (committed on pointerUp)
        useEditorStore.setState((s) => ({
          doc: { ...s.doc, nodes: { ...s.doc.nodes, [id]: { ...node, transform: { ...node.transform, x: nx, y: ny } } } },
        }));
      });
      return;
    }

    if (drag.type === 'resize' && drag.nodeSnapshot && drag.handle) {
      resizeNode(drag.nodeSnapshot, drag.handle, cp.x, cp.y);
      return;
    }

    if (drag.type === 'rotate' && drag.nodeSnapshot) {
      const snap = drag.nodeSnapshot;
      const cx = snap.transform.x + snap.transform.width / 2;
      const cy = snap.transform.y + snap.transform.height / 2;
      const angle = Math.atan2(cp.y - cy, cp.x - cx) * (180 / Math.PI) + 90;
      const snapped = e.shiftKey ? Math.round(angle / 15) * 15 : angle;
      useEditorStore.setState((s) => {
        const node = s.doc.nodes[[...s.selectedIds][0]];
        if (!node) return {};
        return { doc: { ...s.doc, nodes: { ...s.doc.nodes, [node.id]: { ...node, transform: { ...node.transform, rotation: snapped } } } } };
      });
      return;
    }

    if (drag.type === 'draw') {
      // Live preview pointer update — shape committed on pointerUp
      dragRef.current.lastX = cp.x;
      dragRef.current.lastY = cp.y;
      return;
    }

    if (drag.type === 'marquee') {
      const mx = Math.min(drag.startX, cp.x);
      const my = Math.min(drag.startY, cp.y);
      const mw = Math.abs(cp.x - drag.startX);
      const mh = Math.abs(cp.y - drag.startY);
      const hits = hitTestArea(mx, my, mw, mh, doc);
      store.selectIds(hits);
    }
  }, [activeTool, viewport, selectedIds, doc, store, snapEnabled, updateCursor]);

  // ---- Pointer up ----
  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cp = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, viewport);
    const drag = dragRef.current;
    setGuides({ x: [], y: [] });

    if (drag.type === 'draw') {
      const x = Math.min(drag.startX, cp.x);
      const y = Math.min(drag.startY, cp.y);
      const w = Math.max(Math.abs(cp.x - drag.startX), 10);
      const h = Math.max(Math.abs(cp.y - drag.startY), 10);
      let node: AnyNode;
      switch (activeTool) {
        case 'rectangle': node = makeRect(x, y, w, h); break;
        case 'ellipse': node = makeEllipse(x, y, w, h); break;
        case 'line': node = makeLine(x, y, w); break;
        case 'text': node = makeText(x, y); break;
        default: node = makeRect(x, y, w, h);
      }
      store.addNode(node);
      store.setTool('select');
    }

    if (drag.type === 'move' && drag.nodesSnapshot) {
      // Commit as a single undo step by pushing a replace command
      const afterNodes = [...selectedIds].map((id) => doc.nodes[id]).filter(Boolean) as AnyNode[];
      const beforeNodes = drag.nodesSnapshot;
      const { history } = store;
      const before = Object.fromEntries(beforeNodes.map((n) => [n.id, n]));
      const after = Object.fromEntries(afterNodes.map((n) => [n.id, n]));
      history.replace({
        label: 'Move',
        execute() {
          useEditorStore.setState((s) => ({ doc: { ...s.doc, nodes: { ...s.doc.nodes, ...after } } }));
        },
        undo() {
          useEditorStore.setState((s) => ({ doc: { ...s.doc, nodes: { ...s.doc.nodes, ...before } } }));
        },
      });
    }

    dragRef.current = { type: 'none', startX: 0, startY: 0, lastX: 0, lastY: 0 };
  }, [activeTool, viewport, selectedIds, doc, store]);

  // ---- Double click for text editing ----
  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'select') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cp = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, viewport);
    const hitId = hitTestAll(cp.x, cp.y, doc);
    if (!hitId) return;
    const node = doc.nodes[hitId];
    if (!node || node.type !== 'text') return;

    const newContent = window.prompt('Edit text:', (node as any).content ?? '');
    if (newContent !== null) {
      store.updateNode(hitId, { content: newContent } as any);
    }
  }, [activeTool, viewport, doc, store]);

  // ---- Wheel: zoom + pan ----
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (e.ctrlKey || e.metaKey) {
      // Zoom centered on cursor
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.05, Math.min(32, viewport.zoom * factor));
      const scale = newZoom / viewport.zoom;
      store.setViewport({
        zoom: newZoom,
        panX: mx - scale * (mx - viewport.panX),
        panY: my - scale * (my - viewport.panY),
      });
    } else {
      // Pan
      store.setViewport({
        panX: viewport.panX - e.deltaX,
        panY: viewport.panY - e.deltaY,
      });
    }
  }, [viewport, store]);

  // ---- Key shortcuts ----
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.code === 'Space' && !e.repeat) {
        isSpaceDownRef.current = true;
        if (canvasRef.current) {
          canvasRef.current.style.cursor = dragRef.current.type === 'pan' ? 'grabbing' : 'grab';
        }
        e.preventDefault();
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;
      if (e.key === 'Delete' || e.key === 'Backspace') store.deleteSelected();
      if (ctrl && e.key === 'z') { e.preventDefault(); e.shiftKey ? store.redo() : store.undo(); }
      if (ctrl && e.key === 'y') { e.preventDefault(); store.redo(); }
      if (ctrl && e.key === 'c') store.copySelected();
      if (ctrl && e.key === 'v') store.paste();
      if (ctrl && e.key === 'd') { e.preventDefault(); store.duplicateSelected(); }
      if (ctrl && e.key === 'g') { e.preventDefault(); store.groupSelected(); }
      if (ctrl && e.shiftKey && e.key === 'G') { e.preventDefault(); store.ungroupSelected(); }
      if (ctrl && e.key === ']') store.bringForward();
      if (ctrl && e.key === '[') store.sendBackward();
      if (ctrl && e.shiftKey && e.key === ']') store.bringToFront();
      if (ctrl && e.shiftKey && e.key === '[') store.sendToBack();
      if (e.key === 'Escape') {
        store.clearSelection();
        if (activeTool === 'pen' && penPointsRef.current.length > 1) {
          finishPen();
        }
        penPointsRef.current = [];
        store.setTool('select');
      }
      // Tool shortcuts
      if (!ctrl) {
        if (e.key === 'v') store.setTool('select');
        if (e.key === 'r') store.setTool('rectangle');
        if (e.key === 'o') store.setTool('ellipse');
        if (e.key === 'l') store.setTool('line');
        if (e.key === 't') store.setTool('text');
        if (e.key === 'p') store.setTool('pen');
        if (e.key === 'h') store.setTool('hand');
      }
      // Nudge selection
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        const d = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -d : e.key === 'ArrowRight' ? d : 0;
        const dy = e.key === 'ArrowUp' ? -d : e.key === 'ArrowDown' ? d : 0;
        [...selectedIds].forEach((id) => {
          const node = doc.nodes[id];
          if (node) store.updateNode(id, { transform: { ...node.transform, x: node.transform.x + dx, y: node.transform.y + dy } } as any);
        });
        e.preventDefault();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpaceDownRef.current = false;
        if (canvasRef.current && dragRef.current.type !== 'pan') {
          canvasRef.current.style.cursor = activeTool === 'hand' ? 'grab' : 'default';
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [store, selectedIds, doc, activeTool]);

  function finishPen() {
    const pts = penPointsRef.current;
    if (pts.length < 2) { penPointsRef.current = []; return; }
    const node = makePath();
    (node as any).points = pts.map((p) => ({ x: p.x, y: p.y }));
    // Set transform bounding box
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    node.transform = { ...node.transform, x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
    store.addNode(node);
    penPointsRef.current = [];
    penCursorRef.current = null;
    store.setTool('select');
  }

  // Double-click finishes pen path
  const onDoubleClickCanvas = useCallback((e: React.MouseEvent) => {
    if (activeTool === 'pen') { finishPen(); return; }
    onDoubleClick(e);
  }, [activeTool, onDoubleClick]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClickCanvas}
      onWheel={onWheel}
      style={{ touchAction: 'none', display: 'block', width: '100%', height: '100%' }}
    />
  );
};

// ---- Resize logic (handles rotated shapes correctly!) ----
function resizeNode(snapshot: AnyNode, handle: HandleIndex, cx: number, cy: number) {
  if (!handle || handle === 'rotate') return;
  const res = computeRotatedResize(
    snapshot.transform,
    handle,
    cx,
    cy
  );

  useEditorStore.setState((s) => {
    const id = [...s.selectedIds][0];
    if (!id) return {};
    const node = s.doc.nodes[id];
    if (!node) return {};
    return {
      doc: {
        ...s.doc,
        nodes: {
          ...s.doc.nodes,
          [id]: {
            ...node,
            transform: {
              ...node.transform,
              x: res.x,
              y: res.y,
              width: res.width,
              height: res.height,
            },
          },
        },
      },
    };
  });
}

function handleCursor(h: HandleIndex, rotation: number): string {
  const cursors: Record<string, string[]> = {
    tl: ['nwse-resize', 'nesw-resize', 'nwse-resize', 'nesw-resize'],
    tr: ['nesw-resize', 'nwse-resize', 'nesw-resize', 'nwse-resize'],
    bl: ['nesw-resize', 'nwse-resize', 'nesw-resize', 'nwse-resize'],
    br: ['nwse-resize', 'nesw-resize', 'nwse-resize', 'nesw-resize'],
    tc: ['ns-resize', 'ew-resize', 'ns-resize', 'ew-resize'],
    bc: ['ns-resize', 'ew-resize', 'ns-resize', 'ew-resize'],
    ml: ['ew-resize', 'ns-resize', 'ew-resize', 'ns-resize'],
    mr: ['ew-resize', 'ns-resize', 'ew-resize', 'ns-resize'],
    rotate: ['crosshair'],
  };
  if (h === null) return 'default';
  if (h === 'rotate') return 'grab';
  const idx = Math.floor(((rotation % 360 + 360) % 360) / 90);
  return cursors[h]?.[idx] ?? 'default';
}
