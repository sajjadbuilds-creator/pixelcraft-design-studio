// ============================================================
// TopBar.tsx — Menubar with file ops, undo/redo, zoom, export
// ============================================================
import React, { useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import type { Document } from '../model/types';

export interface TopBarProps {
  onOpenShortcuts?: () => void;
  onOpenTemplates?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenShortcuts, onOpenTemplates }) => {
  const store = useEditorStore();
  const { doc, viewport, history, showGrid, snapEnabled, showRulers } = store;
  const fileInputRef = useRef<HTMLInputElement>(null);

  function saveDocument() {
    const json = JSON.stringify(doc, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.name || 'design'}.pixelcraft.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const loaded = JSON.parse(ev.target?.result as string) as Document;
        store.loadDocument(loaded);
      } catch {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function exportPNG() {
    // Render current view to PNG
    const sel = [...store.selectedIds];
    if (sel.length === 0) { alert('Select shapes to export, or select nothing to export all.'); return; }
    
    const ids = sel.length > 0 ? sel : Object.keys(doc.nodes);
    const nodes = ids.map((id) => doc.nodes[id]).filter(Boolean);
    if (nodes.length === 0) return;

    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
      const { x, y, width, height } = n.transform;
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width); maxY = Math.max(maxY, y + height);
    }
    const pad = 20;
    const w = maxX - minX + pad * 2;
    const h = maxY - minY + pad * 2;

    const offscreen = document.createElement('canvas');
    offscreen.width = w * 2; offscreen.height = h * 2;
    const ctx = offscreen.getContext('2d')!;
    ctx.scale(2, 2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.translate(pad - minX, pad - minY);

    // Simple export render
    for (const n of nodes) {
      const { x, y, width, height, rotation } = n.transform;
      ctx.save();
      ctx.translate(x + width/2, y + height/2);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.translate(-width/2, -height/2);
      if (n.fill.type === 'solid') {
        ctx.fillStyle = n.fill.color;
        if (n.type === 'ellipse') {
          ctx.beginPath(); ctx.ellipse(width/2, height/2, width/2, height/2, 0, 0, Math.PI*2); ctx.fill();
        } else { ctx.fillRect(0, 0, width, height); }
      }
      if (n.stroke.width > 0) {
        ctx.strokeStyle = n.stroke.color; ctx.lineWidth = n.stroke.width;
        if (n.type === 'ellipse') {
          ctx.beginPath(); ctx.ellipse(width/2, height/2, width/2, height/2, 0, 0, Math.PI*2); ctx.stroke();
        } else { ctx.strokeRect(0, 0, width, height); }
      }
      ctx.restore();
    }

    offscreen.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'export.png'; a.click();
      URL.revokeObjectURL(url);
    });
  }

  function exportSVG() {
    const nodes = Object.values(doc.nodes).filter((n) =>
      ['rectangle','ellipse','line','text','path'].includes(n.type) && n.visible
    );
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
      const { x, y, width, height } = n.transform;
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width); maxY = Math.max(maxY, y + height);
    }
    const pad = 20;
    const w = maxX - minX + pad * 2;
    const h = maxY - minY + pad * 2;

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
    svgContent += `<rect width="${w}" height="${h}" fill="white"/>`;

    for (const n of nodes) {
      const { x, y, width, height, rotation } = n.transform;
      const nx = x - minX + pad, ny = y - minY + pad;
      const fill = n.fill.type === 'solid' ? n.fill.color : 'none';
      const stroke = n.stroke.width > 0 ? `stroke="${n.stroke.color}" stroke-width="${n.stroke.width}"` : '';
      const transform = rotation !== 0 ? `transform="rotate(${rotation} ${nx + width/2} ${ny + height/2})"` : '';

      if (n.type === 'rectangle' || n.type === 'frame') {
        svgContent += `<rect x="${nx}" y="${ny}" width="${width}" height="${height}" fill="${fill}" ${stroke} ${transform} rx="${n.cornerRadius || 0}"/>`;
      } else if (n.type === 'ellipse') {
        svgContent += `<ellipse cx="${nx + width/2}" cy="${ny + height/2}" rx="${width/2}" ry="${height/2}" fill="${fill}" ${stroke} ${transform}/>`;
      } else if (n.type === 'line') {
        svgContent += `<line x1="${nx}" y1="${ny + height/2}" x2="${nx + width}" y2="${ny + height/2}" ${stroke} ${transform}/>`;
      } else if (n.type === 'text') {
        const tn = n as any;
        svgContent += `<text x="${nx}" y="${ny + tn.fontSize}" font-size="${tn.fontSize}" fill="${tn.color}" font-family="${tn.fontFamily}" ${transform}>${escapeXML(tn.content)}</text>`;
      }
    }
    svgContent += '</svg>';

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'export.svg'; a.click();
    URL.revokeObjectURL(url);
  }

  const zoomPct = Math.round(viewport.zoom * 100);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="app-name">PixelCraft</div>
        
        {/* File menu */}
        <div className="menu-group">
          <span className="menu-label">File</span>
          <div className="menu-dropdown">
            <button onClick={store.newDocument}>New Document</button>
            <button onClick={() => fileInputRef.current?.click()}>Open…</button>
            <button onClick={saveDocument}>Save as JSON</button>
            <hr />
            <button onClick={exportPNG}>Export PNG</button>
            <button onClick={exportSVG}>Export SVG</button>
          </div>
        </div>

        <div className="menu-group">
          <span className="menu-label">Edit</span>
          <div className="menu-dropdown">
            <button onClick={store.undo} disabled={!history.canUndo}>Undo {history.undoLabel}</button>
            <button onClick={store.redo} disabled={!history.canRedo}>Redo {history.redoLabel}</button>
            <hr />
            <button onClick={store.copySelected}>Copy</button>
            <button onClick={store.paste}>Paste</button>
            <button onClick={store.pasteInPlace}>Paste in Place</button>
            <button onClick={store.duplicateSelected}>Duplicate</button>
            <button onClick={store.deleteSelected}>Delete</button>
            <hr />
            <button onClick={store.groupSelected}>Group</button>
            <button onClick={store.ungroupSelected}>Ungroup</button>
          </div>
        </div>

        <div className="menu-group">
          <span className="menu-label">View</span>
          <div className="menu-dropdown">
            <button onClick={() => useEditorStore.setState({ showGrid: !showGrid })}>
              {showGrid ? '✓' : ''} Grid
            </button>
            <button onClick={() => useEditorStore.setState({ snapEnabled: !snapEnabled })}>
              {snapEnabled ? '✓' : ''} Snapping
            </button>
            <button onClick={() => useEditorStore.setState({ showRulers: !showRulers })}>
              {showRulers ? '✓' : ''} Rulers
            </button>
            <hr />
            <button onClick={() => store.setViewport({ zoom: 1 })}>100%</button>
            <button onClick={() => store.setViewport({ zoom: 2 })}>200%</button>
            <button onClick={() => store.setViewport({ zoom: 0.5 })}>50%</button>
          </div>
        </div>
      </div>

      {/* Center — editable doc title and undo/redo */}
      <div className="topbar-center">
        <input
          className="topbar-doc-title"
          value={doc.name || 'Untitled Document'}
          onChange={(e) => useEditorStore.setState((s) => ({ doc: { ...s.doc, name: e.target.value } }))}
          title="Click to rename document"
        />
        <div className="topbar-history-group">
          <button className="icon-btn" onClick={store.undo} disabled={!history.canUndo} title={`Undo (Ctrl+Z) ${history.undoLabel ? '— ' + history.undoLabel : ''}`} aria-label="Undo">↩</button>
          <button className="icon-btn" onClick={store.redo} disabled={!history.canRedo} title={`Redo (Ctrl+Shift+Z) ${history.redoLabel ? '— ' + history.redoLabel : ''}`} aria-label="Redo">↪</button>
        </div>
        <div className="zoom-display" title="Current zoom level">
          {zoomPct}%
        </div>
      </div>

      <div className="topbar-right">
        {onOpenTemplates && (
          <button className="btn-topbar-action" onClick={onOpenTemplates} title="Load Starter Templates">
            <span>✨</span> Templates
          </button>
        )}
        {onOpenShortcuts && (
          <button className="btn-topbar-action" onClick={onOpenShortcuts} title="Keyboard Shortcuts (?)">
            <span>⌨</span>
          </button>
        )}
        <button className="export-btn" onClick={exportPNG} title="Export canvas or selected shapes as PNG">
          ↓ PNG
        </button>
        <button className="export-btn export-btn-accent" onClick={exportSVG} title="Export vector graphic as SVG">
          ↓ SVG
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept=".json,.pixelcraft.json" style={{ display: 'none' }} onChange={loadDocument} />
    </div>
  );
};

function escapeXML(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
