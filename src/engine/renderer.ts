// ============================================================
// renderer.ts — Canvas 2D rendering engine
// Chosen: Canvas 2D — best balance of perf, text rendering,
// and hit-testing simplicity. SVG struggles at 500+ shapes
// due to DOM overhead; WebGL is overkill for a design tool MVP.
// ============================================================
import type { AnyNode, Document, PathNode, TextNode } from '../model/types';
import type { Viewport } from '../store/editorStore';

export interface RenderOptions {
  doc: Document;
  viewport: Viewport;
  selectedIds: Set<string>;
  guides: { x?: number[]; y?: number[] };
  showGrid: boolean;
  penPoints?: { x: number; y: number }[];
  penCursor?: { x: number; y: number } | null;
}

const HANDLE_SIZE = 8;
const HANDLE_COLOR = '#fff';
const HANDLE_BORDER = '#5B8DEF';
const SELECTION_COLOR = '#5B8DEF';
const ROTATE_HANDLE_OFFSET = 24;

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  render(opts: RenderOptions) {
    const { ctx } = this;
    const { viewport, doc, selectedIds, showGrid, guides } = opts;

    // ---- Clear ----
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Dark canvas background
    ctx.fillStyle = '#1e1e2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply viewport transform
    ctx.setTransform(viewport.zoom, 0, 0, viewport.zoom, viewport.panX, viewport.panY);

    // Grid
    if (showGrid) this.drawGrid(viewport);

    // Collect page children in order
    const page = doc.nodes[doc.activePageId];
    const children = page?.children ?? [];

    // Draw all visible nodes bottom-to-top
    for (const id of children) {
      const node = doc.nodes[id];
      if (node && node.visible) this.drawNode(ctx, node, doc);
    }

    // Smart guide lines
    this.drawGuides(guides);

    // Selection boxes (always on top)
    for (const id of selectedIds) {
      const node = doc.nodes[id];
      if (node && node.visible) this.drawSelectionBox(ctx, node);
    }

    // Pen tool preview
    if (opts.penPoints && opts.penPoints.length > 0) {
      this.drawPenPreview(ctx, opts.penPoints, opts.penCursor);
    }
  }

  private drawGrid(viewport: Viewport) {
    const { ctx, canvas } = this;
    const step = 20;
    const w = canvas.width / viewport.zoom;
    const h = canvas.height / viewport.zoom;
    const ox = -viewport.panX / viewport.zoom;
    const oy = -viewport.panY / viewport.zoom;

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = Math.floor(ox / step) * step; x < ox + w; x += step) {
      ctx.moveTo(x, oy);
      ctx.lineTo(x, oy + h);
    }
    for (let y = Math.floor(oy / step) * step; y < oy + h; y += step) {
      ctx.moveTo(ox, y);
      ctx.lineTo(ox + w, y);
    }
    ctx.stroke();
  }

  private drawNode(ctx: CanvasRenderingContext2D, node: AnyNode, doc: Document) {
    ctx.save();
    ctx.globalAlpha = node.opacity;

    const { transform: t } = node;
    const cx = t.x + t.width / 2;
    const cy = t.y + t.height / 2;

    // Apply transform
    ctx.translate(cx, cy);
    ctx.rotate((t.rotation * Math.PI) / 180);
    ctx.translate(-t.width / 2, -t.height / 2);

    // Shadow
    if (node.shadow.enabled) {
      ctx.shadowColor = node.shadow.color;
      ctx.shadowOffsetX = node.shadow.x;
      ctx.shadowOffsetY = node.shadow.y;
      ctx.shadowBlur = node.shadow.blur;
    }

    // Apply fill & stroke helpers
    const setFill = () => {
      if (node.fill.type === 'solid') {
        ctx.fillStyle = hexToRgba(node.fill.color, node.fill.opacity);
      } else {
        ctx.fillStyle = 'transparent';
      }
    };
    const setStroke = () => {
      ctx.strokeStyle = hexToRgba(node.stroke.color, node.stroke.opacity);
      ctx.lineWidth = node.stroke.width;
    };

    switch (node.type) {
      case 'rectangle':
      case 'frame': {
        ctx.beginPath();
        const r = node.cornerRadius || 0;
        if (r > 0) {
          ctx.roundRect(0, 0, t.width, t.height, r);
        } else {
          ctx.rect(0, 0, t.width, t.height);
        }
        ctx.shadowColor = 'transparent'; // reset before fills
        if (node.shadow.enabled) {
          ctx.shadowColor = node.shadow.color;
          ctx.shadowOffsetX = node.shadow.x;
          ctx.shadowOffsetY = node.shadow.y;
          ctx.shadowBlur = node.shadow.blur;
        }
        setFill(); ctx.fill();
        ctx.shadowColor = 'transparent';
        if (node.stroke.width > 0) { setStroke(); ctx.stroke(); }
        break;
      }
      case 'ellipse': {
        ctx.beginPath();
        ctx.ellipse(t.width / 2, t.height / 2, t.width / 2, t.height / 2, 0, 0, Math.PI * 2);
        setFill(); ctx.fill();
        ctx.shadowColor = 'transparent';
        if (node.stroke.width > 0) { setStroke(); ctx.stroke(); }
        break;
      }
      case 'line': {
        ctx.beginPath();
        ctx.moveTo(0, t.height / 2);
        ctx.lineTo(t.width, t.height / 2);
        setStroke(); ctx.stroke();
        break;
      }
      case 'text': {
        const tn = node as TextNode;
        ctx.font = `${tn.fontWeight} ${tn.fontSize}px ${tn.fontFamily}`;
        ctx.fillStyle = tn.color;
        ctx.textBaseline = 'top';
        ctx.textAlign = tn.textAlign as CanvasTextAlign;
        const textX = tn.textAlign === 'center' ? t.width / 2 : tn.textAlign === 'right' ? t.width : 0;
        // Word wrap
        wrapText(ctx, tn.content, textX, 4, t.width, tn.fontSize * 1.4);
        break;
      }
      case 'path': {
        const pn = node as PathNode;
        if (pn.points.length < 2) break;
        ctx.beginPath();
        ctx.moveTo(pn.points[0].x, pn.points[0].y);
        for (let i = 1; i < pn.points.length; i++) {
          const prev = pn.points[i - 1];
          const curr = pn.points[i];
          if (prev.handleOut && curr.handleIn) {
            ctx.bezierCurveTo(
              prev.handleOut.x, prev.handleOut.y,
              curr.handleIn.x, curr.handleIn.y,
              curr.x, curr.y
            );
          } else {
            ctx.lineTo(curr.x, curr.y);
          }
        }
        if (pn.closed) ctx.closePath();
        setFill(); if (node.fill.type !== 'none') ctx.fill();
        ctx.shadowColor = 'transparent';
        if (node.stroke.width > 0) { setStroke(); ctx.stroke(); }
        break;
      }
      case 'group': {
        // Draw children
        for (const childId of (node.children ?? [])) {
          const child = doc.nodes[childId];
          if (child && child.visible) this.drawNode(ctx, child, doc);
        }
        break;
      }
    }

    ctx.restore();
  }

  private drawSelectionBox(ctx: CanvasRenderingContext2D, node: AnyNode) {
    const { transform: t } = node;
    const cx = t.x + t.width / 2;
    const cy = t.y + t.height / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((t.rotation * Math.PI) / 180);
    ctx.translate(-t.width / 2, -t.height / 2);

    // Selection outline
    ctx.strokeStyle = SELECTION_COLOR;
    ctx.lineWidth = 1.5 / (this.ctx.getTransform().a); // compensate zoom
    ctx.setLineDash([]);
    ctx.strokeRect(-1, -1, t.width + 2, t.height + 2);

    // 8 resize handles
    const handles = getHandlePoints(t.width, t.height);
    for (const [hx, hy] of handles) {
      ctx.fillStyle = HANDLE_COLOR;
      ctx.strokeStyle = HANDLE_BORDER;
      ctx.lineWidth = 1.5 / (this.ctx.getTransform().a);
      ctx.fillRect(hx - HANDLE_SIZE / 2, hy - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
      ctx.strokeRect(hx - HANDLE_SIZE / 2, hy - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    }

    // Rotate handle
    ctx.strokeStyle = HANDLE_BORDER;
    ctx.lineWidth = 1 / (this.ctx.getTransform().a);
    ctx.beginPath();
    ctx.moveTo(t.width / 2, -4);
    ctx.lineTo(t.width / 2, -ROTATE_HANDLE_OFFSET);
    ctx.stroke();
    ctx.fillStyle = HANDLE_BORDER;
    ctx.beginPath();
    ctx.arc(t.width / 2, -ROTATE_HANDLE_OFFSET, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawGuides(guides: { x?: number[]; y?: number[] }) {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = '#FF5F5F';
    ctx.lineWidth = 1 / (ctx.getTransform().a);
    ctx.setLineDash([4, 4]);
    for (const x of guides.x ?? []) {
      ctx.beginPath(); ctx.moveTo(x, -9999); ctx.lineTo(x, 9999); ctx.stroke();
    }
    for (const y of guides.y ?? []) {
      ctx.beginPath(); ctx.moveTo(-9999, y); ctx.lineTo(9999, y); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  private drawPenPreview(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[], cursor?: { x: number; y: number } | null) {
    ctx.save();
    ctx.strokeStyle = '#5B8DEF';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    if (points.length > 0) {
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      if (cursor) ctx.lineTo(cursor.x, cursor.y);
    }
    ctx.stroke();
    for (const p of points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ---- Helpers ----

function getHandlePoints(w: number, h: number): [number, number][] {
  return [
    [0, 0], [w / 2, 0], [w, 0],
    [0, h / 2],          [w, h / 2],
    [0, h], [w / 2, h], [w, h],
  ];
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}
