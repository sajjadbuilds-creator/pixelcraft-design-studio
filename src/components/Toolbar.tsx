// ============================================================
// Toolbar.tsx — Left-side tool palette
// ============================================================
import React from 'react';
import { useEditorStore } from '../store/editorStore';
import type { Tool } from '../store/editorStore';

interface ToolDef {
  id: Tool;
  icon: string;
  label: string;
  shortcut: string;
}

const TOOLS: ToolDef[] = [
  { id: 'select',    icon: '↖',  label: 'Select',    shortcut: 'V' },
  { id: 'hand',      icon: '✋',  label: 'Pan',       shortcut: 'H' },
  { id: 'rectangle', icon: '▭',  label: 'Rectangle', shortcut: 'R' },
  { id: 'ellipse',   icon: '◯',  label: 'Ellipse',   shortcut: 'O' },
  { id: 'line',      icon: '╱',  label: 'Line',      shortcut: 'L' },
  { id: 'text',      icon: 'T',  label: 'Text',      shortcut: 'T' },
  { id: 'pen',       icon: '✏',  label: 'Pen',       shortcut: 'P' },
];

export const Toolbar: React.FC = () => {
  const { activeTool, setTool } = useEditorStore();

  return (
    <div className="toolbar">
      <div className="toolbar-logo">
        <span className="logo-icon">◈</span>
        <span className="logo-text">PixelCraft</span>
      </div>
      <div className="toolbar-tools">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
            onClick={() => setTool(tool.id)}
            title={`${tool.label} (${tool.shortcut})`}
            aria-label={tool.label}
            aria-pressed={activeTool === tool.id}
          >
            <span className="tool-icon">{tool.icon}</span>
            <span className="tool-shortcut">{tool.shortcut}</span>
          </button>
        ))}
      </div>
      <div className="toolbar-bottom">
        <button
          className="tool-btn"
          title="Zoom to fit (Ctrl+Shift+H)"
          onClick={() => {
            useEditorStore.getState().setViewport({ zoom: 1, panX: 20, panY: 20 });
          }}
        >
          <span className="tool-icon">⊡</span>
        </button>
      </div>
    </div>
  );
};
