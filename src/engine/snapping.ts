// ============================================================
// snapping.ts — Smart guides and snapping engine
// Snaps to edges/centers of other shapes, equal spacing
// ============================================================
import type { AnyNode, Document } from '../model/types';

export interface SnapResult {
  x: number;
  y: number;
  guideX: number[];
  guideY: number[];
}

const SNAP_THRESHOLD = 6; // pixels in canvas space

interface Edge { v: number; label: 'left' | 'right' | 'top' | 'bottom' | 'cx' | 'cy' }

function getEdges(node: AnyNode): { xs: Edge[]; ys: Edge[] } {
  const { transform: t } = node;
  return {
    xs: [
      { v: t.x, label: 'left' },
      { v: t.x + t.width / 2, label: 'cx' },
      { v: t.x + t.width, label: 'right' },
    ],
    ys: [
      { v: t.y, label: 'top' },
      { v: t.y + t.height / 2, label: 'cy' },
      { v: t.y + t.height, label: 'bottom' },
    ],
  };
}

export function computeSnap(
  movingId: string,
  nx: number, ny: number, nw: number, nh: number,
  doc: Document,
  threshold = SNAP_THRESHOLD
): SnapResult {
  const page = doc.nodes[doc.activePageId];
  const others = (page?.children ?? [])
    .filter((id) => id !== movingId)
    .map((id) => doc.nodes[id])
    .filter((n) => n && n.visible) as AnyNode[];

  const candidateXs: Edge[] = [
    { v: nx, label: 'left' },
    { v: nx + nw / 2, label: 'cx' },
    { v: nx + nw, label: 'right' },
  ];
  const candidateYs: Edge[] = [
    { v: ny, label: 'top' },
    { v: ny + nh / 2, label: 'cy' },
    { v: ny + nh, label: 'bottom' },
  ];

  let snapX: number | null = null;
  let snapY: number | null = null;
  let minDX = threshold;
  let minDY = threshold;
  const guideX: number[] = [];
  const guideY: number[] = [];

  for (const other of others) {
    const { xs, ys } = getEdges(other);
    for (const ce of candidateXs) {
      for (const oe of xs) {
        const d = Math.abs(ce.v - oe.v);
        if (d < minDX) {
          minDX = d;
          snapX = oe.v - (ce.v - nx);
          guideX.length = 0;
          guideX.push(oe.v);
        } else if (d === minDX && snapX !== null) {
          guideX.push(oe.v);
        }
      }
    }
    for (const ce of candidateYs) {
      for (const oe of ys) {
        const d = Math.abs(ce.v - oe.v);
        if (d < minDY) {
          minDY = d;
          snapY = oe.v - (ce.v - ny);
          guideY.length = 0;
          guideY.push(oe.v);
        } else if (d === minDY && snapY !== null) {
          guideY.push(oe.v);
        }
      }
    }
  }

  return {
    x: snapX ?? nx,
    y: snapY ?? ny,
    guideX,
    guideY,
  };
}
