// ============================================================
// StatusBar.tsx — Bottom information bar
// Displays canvas coordinates, selection details, zoom, shortcuts
// ============================================================
import React from 'react';
import { useEditorStore } from '../store/editorStore';

interface StatusBarProps {
  cursorCoords: { x: number; y: number };
  onOpenShortcuts: () => void;
  onOpenTemplates: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  cursorCoords,
  onOpenShortcuts,
  onOpenTemplates,
}) => {
  const { doc, selectedIds, viewport, activeTool, snapEnabled, showGrid, showRulers } = useEditorStore();

  const selectedCount = selectedIds.size;
  const firstSelected = selectedCount === 1 ? doc.nodes[[...selectedIds][0]] : null;

  return (
    <footer className="status-bar" role="contentinfo">
      <div className="status-left">
        <button
          className="status-chip template-chip"
          onClick={onOpenTemplates}
          title="Open Starter Templates"
        >
          <span className="status-chip-icon">✨</span>
          <span>Templates</span>
        </button>

        <div className="status-divider" />

        <div className="status-item cursor-coords" title="Canvas coordinates">
          <span className="coord-label">X:</span> {cursorCoords.x}
          <span className="coord-label" style={{ marginLeft: 6 }}>Y:</span> {cursorCoords.y}
        </div>

        {firstSelected ? (
          <>
            <div className="status-divider" />
            <div className="status-item selection-info">
              <span className="selection-badge">{firstSelected.type}</span>
              <span className="selection-name">{firstSelected.name}</span>
              <span className="selection-dims">
                {Math.round(firstSelected.transform.width)} × {Math.round(firstSelected.transform.height)}
              </span>
              {firstSelected.transform.rotation !== 0 && (
                <span className="selection-rot">∡ {Math.round(firstSelected.transform.rotation)}°</span>
              )}
            </div>
          </>
        ) : selectedCount > 1 ? (
          <>
            <div className="status-divider" />
            <div className="status-item selection-info">
              <span className="selection-badge">{selectedCount} items</span>
              <span>Multiple selected</span>
            </div>
          </>
        ) : (
          <>
            <div className="status-divider" />
            <div className="status-item selection-info muted">
              <span>Ready · Click or drag to create</span>
            </div>
          </>
        )}
      </div>

      <div className="status-right">
        <button
          className={`status-toggle ${snapEnabled ? 'active' : ''}`}
          onClick={() => useEditorStore.setState({ snapEnabled: !snapEnabled })}
          title="Toggle Smart Snapping"
        >
          Magnet {snapEnabled ? 'ON' : 'OFF'}
        </button>

        <button
          className={`status-toggle ${showGrid ? 'active' : ''}`}
          onClick={() => useEditorStore.setState({ showGrid: !showGrid })}
          title="Toggle Grid (G)"
        >
          Grid
        </button>

        <button
          className={`status-toggle ${showRulers ? 'active' : ''}`}
          onClick={() => useEditorStore.setState({ showRulers: !showRulers })}
          title="Toggle Rulers"
        >
          Rulers
        </button>

        <div className="status-divider" />

        <div className="status-item">
          Tool: <strong style={{ textTransform: 'capitalize' }}>{activeTool}</strong>
        </div>

        <div className="status-divider" />

        <div className="status-item zoom-chip">
          {Math.round(viewport.zoom * 100)}%
        </div>

        <button
          className="status-chip shortcuts-chip"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (?)"
        >
          <span>⌨ Shortcuts</span>
        </button>
      </div>
    </footer>
  );
};
