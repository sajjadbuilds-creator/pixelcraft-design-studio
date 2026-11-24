// ============================================================
// PropertiesPanel.tsx — Right-side inspector panel
// Shows/edits: transform, fill, stroke, opacity, corner radius, shadow
// Live-updates as you change values
// ============================================================
import React, { useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import type { AnyNode, TextNode } from '../model/types';

export const PropertiesPanel: React.FC = () => {
  const store = useEditorStore();
  const { doc, selectedIds, viewport } = store;

  const selectedArr = [...selectedIds].map((id) => doc.nodes[id]).filter(Boolean) as AnyNode[];
  const node = selectedArr[0];

  const updateTransform = (patch: Partial<AnyNode['transform']>) => {
    if (!node) return;
    store.updateNode(node.id, { transform: { ...node.transform, ...patch } } as any);
  };

  const updateFill = (patch: any) => {
    if (!node) return;
    store.updateNode(node.id, { fill: { ...node.fill, ...patch } } as any);
  };

  const updateStroke = (patch: any) => {
    if (!node) return;
    store.updateNode(node.id, { stroke: { ...node.stroke, ...patch } } as any);
  };

  const updateShadow = (patch: any) => {
    if (!node) return;
    store.updateNode(node.id, { shadow: { ...node.shadow, ...patch } } as any);
  };

  if (!node) {
    return (
      <div className="panel properties-panel">
        <div className="panel-header"><span>Properties</span></div>
        <div className="properties-empty">
          <div className="empty-icon">◻</div>
          <p>Select a shape to inspect and edit its properties.</p>
        </div>
      </div>
    );
  }

  const { transform: t } = node;

  return (
    <div className="panel properties-panel">
      <div className="panel-header">
        <span>{node.name}</span>
        <span className="node-type-badge">{node.type}</span>
      </div>

      {/* ---- Transform ---- */}
      <section className="prop-section">
        <div className="prop-section-title">Transform</div>
        <div className="prop-grid-2">
          <NumberInput label="X" value={Math.round(t.x)} onChange={(v) => updateTransform({ x: v })} />
          <NumberInput label="Y" value={Math.round(t.y)} onChange={(v) => updateTransform({ y: v })} />
          <NumberInput label="W" value={Math.round(t.width)} onChange={(v) => updateTransform({ width: Math.max(1, v) })} />
          <NumberInput label="H" value={Math.round(t.height)} onChange={(v) => updateTransform({ height: Math.max(1, v) })} />
        </div>
        <div className="prop-grid-2">
          <NumberInput label="°" value={Math.round(t.rotation)} onChange={(v) => updateTransform({ rotation: v })} step={1} />
          <NumberInput label="R" value={node.cornerRadius ?? 0} onChange={(v) => store.updateNode(node.id, { cornerRadius: v } as any)} min={0} />
        </div>
      </section>

      {/* ---- Opacity ---- */}
      <section className="prop-section">
        <div className="prop-section-title">Opacity</div>
        <div className="prop-row">
          <input
            type="range" min={0} max={1} step={0.01}
            value={node.opacity}
            onChange={(e) => store.updateNode(node.id, { opacity: parseFloat(e.target.value) } as any)}
            className="range-input"
          />
          <span className="range-value">{Math.round(node.opacity * 100)}%</span>
        </div>
      </section>

      {/* ---- Fill ---- */}
      <section className="prop-section">
        <div className="prop-section-title">
          Fill
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={node.fill.type === 'solid'}
              onChange={(e) => updateFill({ type: e.target.checked ? 'solid' : 'none' })}
            />
          </label>
        </div>
        {node.fill.type === 'solid' && (
          <div className="prop-row">
            <input
              type="color"
              value={node.fill.color}
              onChange={(e) => updateFill({ color: e.target.value })}
              className="color-input"
            />
            <input
              type="text"
              value={node.fill.color}
              onChange={(e) => { if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) updateFill({ color: e.target.value }); }}
              className="hex-input"
              maxLength={7}
            />
            <NumberInput label="A" value={Math.round(node.fill.opacity * 100)} onChange={(v) => updateFill({ opacity: v / 100 })} min={0} max={100} />
          </div>
        )}
      </section>

      {/* ---- Stroke ---- */}
      <section className="prop-section">
        <div className="prop-section-title">Stroke</div>
        <div className="prop-row">
          <input
            type="color"
            value={node.stroke.color}
            onChange={(e) => updateStroke({ color: e.target.value })}
            className="color-input"
          />
          <input
            type="text"
            value={node.stroke.color}
            onChange={(e) => { if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) updateStroke({ color: e.target.value }); }}
            className="hex-input"
            maxLength={7}
          />
          <NumberInput label="W" value={node.stroke.width} onChange={(v) => updateStroke({ width: v })} min={0} max={50} />
        </div>
      </section>

      {/* ---- Text-specific ---- */}
      {node.type === 'text' && (
        <section className="prop-section">
          <div className="prop-section-title">Text</div>
          <div className="prop-col">
            <textarea
              className="text-content-input"
              value={(node as TextNode).content}
              onChange={(e) => store.updateNode(node.id, { content: e.target.value } as any)}
              rows={3}
            />
            <div className="prop-row">
              <NumberInput label="Size" value={(node as TextNode).fontSize} onChange={(v) => store.updateNode(node.id, { fontSize: v } as any)} min={6} />
              <input
                type="color"
                value={(node as TextNode).color}
                onChange={(e) => store.updateNode(node.id, { color: e.target.value } as any)}
                className="color-input"
                title="Text color"
              />
            </div>
          </div>
        </section>
      )}

      {/* ---- Drop Shadow ---- */}
      <section className="prop-section">
        <div className="prop-section-title">
          Drop Shadow
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={node.shadow.enabled}
              onChange={(e) => updateShadow({ enabled: e.target.checked })}
            />
          </label>
        </div>
        {node.shadow.enabled && (
          <div className="prop-grid-2">
            <NumberInput label="X" value={node.shadow.x} onChange={(v) => updateShadow({ x: v })} />
            <NumberInput label="Y" value={node.shadow.y} onChange={(v) => updateShadow({ y: v })} />
            <NumberInput label="Blur" value={node.shadow.blur} onChange={(v) => updateShadow({ blur: v })} min={0} />
            <NumberInput label="Spread" value={node.shadow.spread} onChange={(v) => updateShadow({ spread: v })} />
          </div>
        )}
      </section>

      {/* ---- Layer order ---- */}
      <section className="prop-section">
        <div className="prop-section-title">Order</div>
        <div className="layer-order-btns">
          <button onClick={store.bringToFront} title="Bring to Front (Ctrl+Shift+])">⤴ Front</button>
          <button onClick={store.bringForward} title="Bring Forward (Ctrl+])">↑ Fwd</button>
          <button onClick={store.sendBackward} title="Send Backward (Ctrl+[)">↓ Back</button>
          <button onClick={store.sendToBack} title="Send to Back (Ctrl+Shift+[)">⤵ Back</button>
        </div>
      </section>

      {/* Zoom info */}
      <div className="viewport-info">
        Zoom: {Math.round(viewport.zoom * 100)}%
      </div>
    </div>
  );
};

// ---- Reusable numeric input ----
interface NI { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; }
const NumberInput: React.FC<NI> = ({ label, value, onChange, step = 1, min, max }) => {
  const [local, setLocal] = useState('');
  const [focused, setFocused] = useState(false);

  return (
    <label className="number-input-label">
      <span className="number-input-prefix">{label}</span>
      <input
        type="number"
        className="number-input"
        value={focused ? local : value}
        step={step}
        min={min}
        max={max}
        onFocus={() => { setFocused(true); setLocal(String(value)); }}
        onBlur={() => { setFocused(false); const n = parseFloat(local); if (!isNaN(n)) onChange(n); }}
        onChange={(e) => setLocal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      />
    </label>
  );
};
