// ============================================================
// LayersPanel.tsx — The document tree on the left
// Supports: visibility, lock, rename, reorder (drag), selection
// ============================================================
import React, { useState, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import type { AnyNode } from '../model/types';

const TYPE_ICONS: Record<string, string> = {
  rectangle: '▭',
  ellipse: '◯',
  line: '╱',
  text: 'T',
  path: '✏',
  group: '⊞',
  frame: '⊡',
  page: '📄',
};

export const LayersPanel: React.FC = () => {
  const store = useEditorStore();
  const { doc, selectedIds } = store;
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const dragNodeRef = useRef<string | null>(null);

  const page = doc.nodes[doc.activePageId];
  const children = [...(page?.children ?? [])].reverse(); // top layer first in UI

  function startRename(id: string, name: string) {
    setRenamingId(id);
    setRenameValue(name);
  }

  function commitRename() {
    if (renamingId) {
      store.renameNode(renamingId, renameValue || 'Layer');
      setRenamingId(null);
    }
  }

  function onDragStart(e: React.DragEvent, id: string) {
    dragNodeRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!dragNodeRef.current || dragNodeRef.current === targetId) return;
    store.reorderNode(dragNodeRef.current, targetId, 'before');
    dragNodeRef.current = null;
  }

  function renderNode(node: AnyNode) {
    const isSelected = selectedIds.has(node.id);
    return (
      <div
        key={node.id}
        className={`layer-item ${isSelected ? 'selected' : ''} ${node.locked ? 'locked' : ''}`}
        draggable
        onDragStart={(e) => onDragStart(e, node.id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onDrop(e, node.id)}
        onClick={(e) => store.selectIds([node.id], e.shiftKey)}
      >
        <span className="layer-icon">{TYPE_ICONS[node.type] ?? '◻'}</span>

        {renamingId === node.id ? (
          <input
            className="layer-rename-input"
            value={renameValue}
            autoFocus
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingId(null); }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="layer-name" onDoubleClick={(e) => { e.stopPropagation(); startRename(node.id, node.name); }}>
            {node.name}
          </span>
        )}

        <div className="layer-actions">
          <button
            className={`layer-action-btn ${node.visible ? '' : 'dimmed'}`}
            onClick={(e) => { e.stopPropagation(); store.toggleVisibility(node.id); }}
            title={node.visible ? 'Hide' : 'Show'}
            aria-label={node.visible ? 'Hide layer' : 'Show layer'}
          >
            {node.visible ? '👁' : '🚫'}
          </button>
          <button
            className={`layer-action-btn ${node.locked ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); store.toggleLock(node.id); }}
            title={node.locked ? 'Unlock' : 'Lock'}
            aria-label={node.locked ? 'Unlock layer' : 'Lock layer'}
          >
            {node.locked ? '🔒' : '🔓'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel layers-panel">
      <div className="panel-header">
        <span>Layers</span>
        <span className="panel-count">{children.length}</span>
      </div>
      <div className="layers-list">
        {children.length === 0 && (
          <div className="layers-empty">Draw something on the canvas ✨</div>
        )}
        {children.map((id) => {
          const node = doc.nodes[id];
          if (!node) return null;
          return renderNode(node);
        })}
      </div>
    </div>
  );
};
