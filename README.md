# PixelCraft — Mini Figma

> A high-performance, browser-based vector design tool and canvas editor built completely from scratch in TypeScript and React.

PixelCraft is an interactive design tool implementing the core mechanics of Figma: affine transformation matrices, custom Canvas 2D rendering, rotated hit-testing, an extensible tree document model, command-pattern undo/redo history with drag coalescing, smart alignment guides, a vector pen tool, layer tree reordering, and lossless JSON/SVG/PNG export.

---

## 🚀 Quick Start & Setup

### Prerequisites
- **Node.js**: v18.0.0 or later (tested on v20+)
- **npm**: v9.0.0 or later

### Installation & Run

```bash
# 1. Clone or navigate to the repository
cd figma_project

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Open in browser
# Navigate to http://localhost:5173
```

### Production Build & Tests

```bash
# Run unit test suite (transforms, matrices, hit-testing, history)
npm test

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📐 Architecture Overview

PixelCraft separates concerns strictly across four architectural layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Chrome & Panels                       │
│  (TopBar, Toolbar, LayersPanel, PropertiesPanel, StatusBar) │
└──────────────────────────────┬──────────────────────────────┘
                               │ Dispatches Actions / Reads State
┌──────────────────────────────▼──────────────────────────────┐
│                  Global State & History                     │
│  (Zustand store, Command Pattern Undo/Redo, Clipboard)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ Synchronizes Document Tree
┌──────────────────────────────▼──────────────────────────────┐
│                    Document Tree Model                      │
│  (Document -> Page -> Frames -> Groups -> Shapes / Paths)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Feeds Render Loop & Queries
┌──────────────────────────────▼──────────────────────────────┐
│                   Canvas Engine & Math                      │
│  - Affine 2D Matrix math (Mat.multiply, Mat.inverse)        │
│  - Canvas 2D Renderer (60 FPS requestAnimationFrame loop)   │
│  - Rotated Bounding-Box & Ellipse Hit-Testing               │
│  - Smart Guides & Edge / Center Snapping Engine             │
└─────────────────────────────────────────────────────────────┘
```

### Folder Structure

```
src/
├── model/                 # Document specifications and domain model
│   ├── types.ts           # Node types, Transform, Fill, Stroke, Shadow, Document interfaces
│   ├── defaults.ts        # Factory builders for Rectangle, Ellipse, Line, Text, Path, Frame
│   ├── history.ts         # Command pattern with bounded history and drag coalescing
│   └── templates.ts       # Handcrafted starter designs (Mobile App UI, SaaS Analytics)
├── engine/                # Core math and canvas execution engine (no UI framework dependencies)
│   ├── math.ts            # Affine matrices (3x3), rotated transforms, rotated resize math
│   ├── renderer.ts        # Canvas 2D rendering pipeline (bottom-up z-index, selection, guides)
│   ├── hitTest.ts         # Rotated shape hit-testing & 8 resize/rotate handle pickers
│   └── snapping.ts        # Dynamic bounding-box edge, center, and guide computation
├── store/                 # Predictable state management
│   └── editorStore.ts     # Zustand store holding document tree, selection, tool & viewport
├── components/            # Figma-like dark UI panels & components
│   ├── Canvas.tsx         # Pointer capture, gesture management, RAF canvas container
│   ├── TopBar.tsx         # Document rename, undo/redo, file operations, PNG/SVG exports
│   ├── Toolbar.tsx        # Vertical tool palette with keyboard shortcuts
│   ├── LayersPanel.tsx    # Drag-and-drop reordering, rename, visibility & lock toggles
│   ├── PropertiesPanel.tsx# Geometry, fills, borders, opacity, corner radius, drop shadow
│   ├── StatusBar.tsx      # Live canvas coordinates (X, Y), active tool, zoom, selection stats
│   ├── Rulers.tsx         # Dynamic pixel rulers synchronized with zoom and pan
│   ├── ShortcutsModal.tsx # Keyboard shortcut cheatsheet dialog (? key)
│   └── TemplatesModal.tsx # Starter template loader
└── __tests__/             # Unit tests
    ├── math.test.ts       # Matrix operations, rotation transforms, hit-testing, rotated resize
    └── history.test.ts    # Undo/redo stack, command branching, drag micro-move coalescing
```

---

## 🎨 Rendering Approach: Justification of Canvas 2D

When choosing between **SVG**, **Canvas 2D**, and **WebGL**, we evaluated each against design tool requirements:

| Criteria | SVG | Canvas 2D (Chosen) | WebGL |
| :--- | :--- | :--- | :--- |
| **500+ Shapes Performance** | ❌ Slow (DOM bloat, layout recalculations) | ✅ Excellent (60 FPS batch drawing in RAF) | ✅ Extreme performance |
| **Text Rendering & Typography** | ✅ Native DOM font metrics | ✅ Canvas `measureText` & `fillText` | ❌ Very complex (SDF glyph atlases needed) |
| **Hit-Testing Flexibility** | ⚠️ Tied to DOM event bubbling | ✅ Mathematically precise in world space | ❌ Requires color-picking or custom geometry |
| **Path & Bézier Curves** | ✅ Easy `<path>` elements | ✅ Native `bezierCurveTo` & `arc` | ⚠️ Complex shader tessellation |
| **Implementation Complexity** | Low | Balanced & Maintainable | Very high for 2D vectors |

### Why Canvas 2D:
1. **Predictable Performance**: Canvas 2D draws directly to an offscreen bitmap. With 500+ shapes on screen, Canvas 2D retains a stable 60 FPS requestAnimationFrame render loop without triggering browser DOM garbage collection or style recalculations.
2. **Text Quality**: High-dpi text rendering with native font kerning and word wrapping is supported out of the box.
3. **Decoupled Architecture**: Rendering logic is a clean pure function of `(Document, Viewport, Selection, Guides)` with no framework lock-in.

---

## 🌐 Coordinate Spaces & Math

The editor maintains strict separation between three distinct coordinate systems:

1. **Screen Space (Pixels)**:
   Pointer coordinates relative to the canvas DOM element (`clientX - rect.left`).
2. **Canvas / World Space**:
   Absolute design canvas space independent of viewport scale or panning:
   $$\text{canvasX} = \frac{\text{screenX} - \text{panX}}{\text{zoom}}$$
   $$\text{canvasY} = \frac{\text{screenY} - \text{panY}}{\text{zoom}}$$
3. **Local Shape Space**:
   Shape coordinates relative to the shape center with rotation unapplied ($-\theta$):
   $$\text{localX} = \cos(-\theta)(X - C_x) - \sin(-\theta)(Y - C_y)$$
   $$\text{localY} = \sin(-\theta)(X - C_x) + \cos(-\theta)(Y - C_y)$$

### Rotated Resizing Algorithm
A common flaw in simple vector editors is that resizing a rotated rectangle causes it to jump or drift. PixelCraft implements anchor-preserving rotated resize (`computeRotatedResize`):
- For any handle (e.g., bottom-right `br`), its opposite anchor (top-left `tl`) is fixed in world space.
- The pointer's displacement vector from the fixed anchor is transformed into local rotated axes.
- The new dimensions $(W, H)$ are calculated, and the new center is mapped back into world coordinates, keeping the anchor completely stationary.

---

## 🔄 State Management & Undo/Redo

Every user operation is encapsulated as a `Command`:
```typescript
interface Command {
  label: string;
  execute(): void;
  undo(): void;
}
```

### Drag Coalescing
A common pitfall is generating hundreds of history steps when dragging a shape for 2 seconds. PixelCraft handles this via `history.replace()`:
- While actively dragging, micro-updates continuously mutate the node for 60 FPS live feedback.
- On `pointerUp`, a single consolidated command holding the before-snapshot and after-snapshot is committed.
- One click of **Undo (`Ctrl+Z`)** returns the shape to its pre-drag position in a single step.

---

## 📋 Feature Breakdown

### Level 1: Core Canvas (Must Have)
- [x] **Vector Shapes**: Rectangle, Ellipse, Line, and Text nodes with custom properties.
- [x] **Selection**:
  - Single click to select.
  - `Shift + Click` for additive multi-select.
  - Marquee drag selection box covering multiple shapes.
- [x] **Transformations**:
  - Drag to move single or multi-selected shapes.
  - 8 resize handles (top-left, top-center, top-right, middle-left, middle-right, bottom-left, bottom-center, bottom-right).
  - Geometrically correct resizing on arbitrarily rotated shapes.
  - Rotation handle with 15° snap when holding `Shift`.
- [x] **Viewport Navigation**:
  - Zoom centered on cursor via `Ctrl + Scroll` (5% to 3200%).
  - Smooth pan with `Space + Drag`, middle-click drag, or Hand tool (`H`).
- [x] **Undo / Redo**:
  - Bounded 200-step command history.
  - Supports moves, property edits, layer reordering, additions, and deletions.
- [x] **Keyboard Shortcuts**:
  - `Delete` / `Backspace`: Remove selected shapes.
  - `Ctrl + D`: Duplicate selection with offset.
  - `V`, `R`, `O`, `L`, `T`, `P`, `H`: Instant tool selection.
  - Arrow keys: 1px nudging (or 10px with `Shift`).

### Level 2: Real Editor Features (Should Have)
- [x] **Pen Tool (`P`)**:
  - Click to place anchor points and build connected vector paths.
  - Live cursor preview line.
  - Double-click or `Esc` to finish and commit the vector path.
- [x] **Layers Tree Panel**:
  - Hierarchical view of document tree.
  - Drag-and-drop to reorder layers visually.
  - Double-click layer name to rename.
  - Toggle layer visibility (👁/🚫) and lock states (🔒/🔓).
  - Grouping (`Ctrl + G`) and ungrouping (`Ctrl + Shift + G`).
  - Layer arrangement controls: Bring to Front, Bring Forward, Send Backward, Send to Back.
- [x] **Properties Inspector**:
  - Geometry: X, Y, Width, Height, Rotation angle, Corner radius.
  - Fill: Solid hex color picker, opacity slider, toggle fill on/off.
  - Stroke: Color picker, stroke width slider.
  - Typography: Live content editor, font size, text color.
  - Effects: Drop shadow (X offset, Y offset, Blur, Spread, toggle).
  - Changes apply live to all selected items.
- [x] **Smart Guides & Snapping**:
  - Magnetic snapping to other shapes' edges (left, right, top, bottom) and centers (cx, cy).
  - Distinct red guide lines appear dynamically when aligned.
  - Toggle snapping on/off via status bar or View menu.
- [x] **Clipboard**:
  - `Ctrl + C`: Copy selected nodes.
  - `Ctrl + V`: Paste with 20px offset.
  - Paste in place: Exact coordinate reproduction.
- [x] **Save & Load**:
  - Lossless export to `.pixelcraft.json`.
  - Import JSON documents with instant document tree reconstruction.

### Level 3 & Bonus Features
- [x] **Export Formats**:
  - **PNG Export**: High-resolution 2x canvas raster export with bounding-box cropping.
  - **SVG Export**: Clean, standard `<svg>` markup with embedded shapes, colors, and transforms.
- [x] **Starter Design Templates**:
  - Pre-built templates accessible via TopBar or Status Bar:
    1. *Mobile App Sign-In*: Responsive mobile frame, inputs, badges, and glowing CTA.
    2. *SaaS Analytics Dashboard*: Metric KPI cards, status indicators, and bar charts.
    3. *Blank Canvas*: Clean white artboard for freeform drawing.
- [x] **Interactive Rulers**:
  - Dynamic top and left canvas rulers with tick marks and active cursor tracking.
- [x] **Keyboard Shortcuts Cheatsheet**:
  - Built-in dialog popup accessible via `?` or status bar button.
- [x] **Comprehensive Test Suite**:
  - Vitest unit tests verifying matrices, rotation hit-testing, rotated resize math, and history stacks.

---

## 🐛 Known Limitations & Tradeoffs

1. **Text Editing within Canvas**: Text editing is currently handled via double-click prompt and properties panel textarea. A rich in-place contenteditable overlaid DOM element would offer a more authentic word-processing experience.
2. **Boolean Operations**: Path-path union/subtract requires a geometry clipping library (e.g. Clipper.js or Paper.js) to resolve complex winding rules; this is scoped as the next primary enhancement.
3. **Multi-User WebSocket Sync**: The document model is structured cleanly as flat node dictionaries specifically to support CRDTs (such as Yjs or Automerge) in a future update.

---

## 🔮 What We Would Build Next

1. **Boolean Vector Operations**: Combine shapes with Union, Subtract, Intersect, and Exclude.
2. **Auto-Layout Containers**: Flexbox-style frame auto-arrangement with `gap`, `padding`, and alignment rules.
3. **Component System**: Master components with reusable instances that inherit overrides.
4. **Multiplayer Live Cursors**: WebRTC / WebSocket presence awareness with color-coded collaborator cursors.
