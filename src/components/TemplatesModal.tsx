// ============================================================
// TemplatesModal.tsx — Starter Template Picker
// Gives users handcrafted starter designs to explore
// ============================================================
import React from 'react';
import { TEMPLATES } from '../model/templates';
import { useEditorStore } from '../store/editorStore';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({ isOpen, onClose }) => {
  const { loadDocument, newDocument } = useEditorStore();

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="templates-title">
      <div className="modal-content templates-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 id="templates-title" className="modal-title">
              <span>✨</span> Starter Templates
            </h2>
            <p className="modal-subtitle">Pick a pre-designed layout or begin with an empty artboard</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <div className="modal-body templates-grid">
          <div
            className="template-card fresh-card"
            onClick={() => {
              newDocument();
              onClose();
            }}
          >
            <div className="template-icon">📄</div>
            <div className="template-info">
              <h4 className="template-name">Blank Canvas</h4>
              <p className="template-desc">Start fresh with a clean white artboard and zero distractions</p>
            </div>
            <button className="template-select-btn">New Canvas</button>
          </div>

          {TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              className="template-card"
              onClick={() => {
                loadDocument(tmpl.create());
                onClose();
              }}
            >
              <div className="template-icon">{tmpl.icon}</div>
              <div className="template-info">
                <h4 className="template-name">{tmpl.name}</h4>
                <p className="template-desc">{tmpl.description}</p>
              </div>
              <button className="template-select-btn">Load Template</button>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <span className="modal-hint">All designs support full vector editing, layer nesting, and SVG/PNG export</span>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
