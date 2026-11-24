// ============================================================
// App.tsx — PixelCraft Design Studio
// Main application layout with Canvas, Toolbars, Panels, Modals
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { Toolbar } from './components/Toolbar';
import { LayersPanel } from './components/LayersPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Canvas } from './components/Canvas';
import { StatusBar } from './components/StatusBar';
import { ShortcutsModal } from './components/ShortcutsModal';
import { TemplatesModal } from './components/TemplatesModal';
import { Rulers } from './components/Rulers';
import { createMobileAppTemplate } from './model/templates';
import { useEditorStore } from './store/editorStore';
import './App.css';

export const App: React.FC = () => {
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [leftTab, setLeftTab] = useState<'layers' | 'assets'>('layers');

  // Load a starter template on first mount so the canvas looks awesome immediately!
  useEffect(() => {
    const hasVisited = sessionStorage.getItem('pixelcraft_init');
    if (!hasVisited) {
      sessionStorage.setItem('pixelcraft_init', '1');
      useEditorStore.getState().loadDocument(createMobileAppTemplate());
    }
  }, []);

  // Global key for ? -> open shortcuts modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '?') {
        setIsShortcutsOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handlePointerCoords = useCallback((x: number, y: number) => {
    setCursorCoords({ x, y });
  }, []);

  return (
    <div className="pixelcraft-app">
      {/* Top Header */}
      <TopBar
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="workspace-body">
        {/* Left Bar: Toolbar + Layers Sidebar */}
        <aside className="sidebar-left">
          <Toolbar />
          <div className="left-panel-container">
            <div className="left-tabs">
              <button
                className={`tab-btn ${leftTab === 'layers' ? 'active' : ''}`}
                onClick={() => setLeftTab('layers')}
              >
                Layers
              </button>
            </div>
            {leftTab === 'layers' && <LayersPanel />}
          </div>
        </aside>

        {/* Center: Canvas Area with Optional Rulers */}
        <main className="canvas-container">
          <Rulers cursorCoords={cursorCoords} />
          <Canvas onPointerCoords={handlePointerCoords} />
        </main>

        {/* Right Inspector: Properties Panel */}
        <aside className="sidebar-right">
          <PropertiesPanel />
        </aside>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        cursorCoords={cursorCoords}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
      />

      {/* Floating Modals */}
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      <TemplatesModal isOpen={isTemplatesOpen} onClose={() => setIsTemplatesOpen(false)} />
    </div>
  );
};

export default App;
