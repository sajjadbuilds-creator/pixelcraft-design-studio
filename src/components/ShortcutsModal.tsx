// ============================================================
// ShortcutsModal.tsx — Keyboard shortcuts dialog
// Shows all editor keys categorized with realistic layout
// ============================================================
import React from 'react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  category: string;
  items: { key: string; desc: string }[];
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    category: 'Tools',
    items: [
      { key: 'V', desc: 'Move / Selection tool' },
      { key: 'H / Space', desc: 'Hand tool (pan canvas)' },
      { key: 'R', desc: 'Rectangle tool' },
      { key: 'O', desc: 'Ellipse tool' },
      { key: 'L', desc: 'Line tool' },
      { key: 'T', desc: 'Text tool' },
      { key: 'P', desc: 'Pen tool (Bézier curves)' },
      { key: 'Esc', desc: 'Cancel tool / Clear selection' },
    ],
  },
  {
    category: 'Canvas & Viewport',
    items: [
      { key: 'Ctrl + Scroll', desc: 'Zoom centered on cursor' },
      { key: 'Space + Drag', desc: 'Smooth pan around canvas' },
      { key: 'Middle Click + Drag', desc: 'Pan canvas directly' },
      { key: 'Arrow Keys', desc: 'Nudge selection by 1px' },
      { key: 'Shift + Arrows', desc: 'Nudge selection by 10px' },
    ],
  },
  {
    category: 'Arrangement & History',
    items: [
      { key: 'Ctrl + Z', desc: 'Undo last action' },
      { key: 'Ctrl + Shift + Z / Ctrl + Y', desc: 'Redo action' },
      { key: 'Ctrl + C / V', desc: 'Copy and Paste' },
      { key: 'Ctrl + D', desc: 'Duplicate selection' },
      { key: 'Ctrl + G', desc: 'Group selected shapes' },
      { key: 'Ctrl + Shift + G', desc: 'Ungroup shapes' },
      { key: 'Ctrl + ]', desc: 'Bring forward' },
      { key: 'Ctrl + [', desc: 'Send backward' },
      { key: 'Ctrl + Shift + ]', desc: 'Bring to front' },
      { key: 'Ctrl + Shift + [', desc: 'Send to back' },
      { key: 'Delete / Backspace', desc: 'Delete selected nodes' },
    ],
  },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="shortcuts-title" className="modal-title">
            <span>⌨</span> Keyboard Shortcuts
          </h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <div className="modal-body shortcuts-grid">
          {SHORTCUTS.map((group) => (
            <div key={group.category} className="shortcut-group">
              <h3 className="shortcut-group-title">{group.category}</h3>
              <div className="shortcut-items">
                {group.items.map((item) => (
                  <div key={item.key} className="shortcut-row">
                    <span className="shortcut-desc">{item.desc}</span>
                    <kbd className="shortcut-kbd">{item.key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <span className="modal-hint">Tip: Hold <kbd>Shift</kbd> while rotating to snap in 15° increments</span>
          <button className="btn btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
