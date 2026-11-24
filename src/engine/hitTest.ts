// ============================================================
// hitTest.ts — Picking shapes from canvas coordinates
// Works correctly for rotated & scaled shapes
// ============================================================
import type { AnyNode, Document } from '../model/types';
import { hitTestRotatedRect, hitTestRotatedEllipse } from './math';

const HANDLE_HIT_RADIUS = 10;

export type HandleIndex =
  | 'tl' | 'tc' | 'tr'
  | 'ml' |         'mr'
  | 'bl' | 'bc' | 'br'
  | 'rotate'
  | null;

export function hitTestNode(px: number, py: number, node: AnyNode): boolean {
  if (!node.visible || node.locked) return false;
  const { transform: t } = node;

  switch (node.type) {
    case 'ellipse':
      return hitTestRotatedEllipse(px, py, t.x, t.y, t.width, t.height, t.rotation);
    case 'line': {
      // Line: thin rect rotated
      const pad = Math.max(node.stroke.width / 2, 5);
      return hitTestRotatedRect(px, py, t.x, t.y - pad, t.width, pad * 2, t.rotation);
    }
    default:
      return hitTestRotatedRect(px, py, t.x, t.y, t.width, t.height, t.rotation);
  }
}

export function hitTestAll(px: number, py: number, doc: Document): string | null {
  const page = doc.nodes[doc.activePageId];
  const children = [...(page?.children ?? [])].reverse(); // top-down

  for (const id of children) {
    const node = doc.nodes[id];
    if (!node) continue;
    if (node.type === 'group') {
      for (const childId of [...(node.children ?? [])].reverse()) {
        const child = doc.nodes[childId];
        if (child && hitTestNode(px, py, child)) return childId;
      }
    }
    if (hitTestNode(px, py, node)) return id;
  }
  return null;
}

export function hitTestArea(
  sx: number, sy: number, sw: number, sh: number,
  doc: Document
): string[] {
  const page = doc.nodes[doc.activePageId];
  const children = page?.children ?? [];
  const minX = Math.min(sx, sx + sw);
  const minY = Math.min(sy, sy + sh);
  const maxX = Math.max(sx, sx + sw);
  const maxY = Math.max(sy, sy + sh);

  return children.filter((id) => {
    const node = doc.nodes[id];
    if (!node || !node.visible) return false;
    const { transform: t } = node;
    return (
      t.x >= minX && t.y >= minY &&
      t.x + t.width <= maxX && t.y + t.height <= maxY
    );
  });
}

/** Returns which resize/rotate handle was hit, or null */
export function hitTestHandle(
  px: number, py: number,
  node: AnyNode,
  zoom: number
): HandleIndex {
  const { transform: t } = node;
  const cx = t.x + t.width / 2;
  const cy = t.y + t.height / 2;

  // Transform click into local space
  const r = (-t.rotation * Math.PI) / 180;
  const cos = Math.cos(r), sin = Math.sin(r);
  const lx = cos * (px - cx) - sin * (py - cy) + t.width / 2;
  const ly = sin * (px - cx) + cos * (py - cy) + t.height / 2;

  const hits = (hx: number, hy: number) => {
    const radius = HANDLE_HIT_RADIUS / zoom;
    return Math.abs(lx - hx) <= radius && Math.abs(ly - hy) <= radius;
  };

  const rotateY = -24 / zoom;
  if (hits(t.width / 2, rotateY)) return 'rotate';

  if (hits(0, 0)) return 'tl';
  if (hits(t.width / 2, 0)) return 'tc';
  if (hits(t.width, 0)) return 'tr';
  if (hits(0, t.height / 2)) return 'ml';
  if (hits(t.width, t.height / 2)) return 'mr';
  if (hits(0, t.height)) return 'bl';
  if (hits(t.width / 2, t.height)) return 'bc';
  if (hits(t.width, t.height)) return 'br';

  return null;
}
