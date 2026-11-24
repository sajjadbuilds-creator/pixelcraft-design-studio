// ============================================================
// math.ts — 2D geometry helpers used throughout the editor
// ============================================================

export interface Vec2 { x: number; y: number; }

/** 3×3 affine matrix stored row-major [a,b,c,d,e,f] matching Canvas2D convention */
export type Matrix = [number, number, number, number, number, number];

export const Mat = {
  identity: (): Matrix => [1, 0, 0, 1, 0, 0],

  multiply(a: Matrix, b: Matrix): Matrix {
    return [
      a[0] * b[0] + a[2] * b[1],
      a[1] * b[0] + a[3] * b[1],
      a[0] * b[2] + a[2] * b[3],
      a[1] * b[2] + a[3] * b[3],
      a[0] * b[4] + a[2] * b[5] + a[4],
      a[1] * b[4] + a[3] * b[5] + a[5],
    ];
  },

  translate(tx: number, ty: number): Matrix {
    return [1, 0, 0, 1, tx, ty];
  },

  rotate(deg: number): Matrix {
    const r = (deg * Math.PI) / 180;
    const c = Math.cos(r), s = Math.sin(r);
    return [c, s, -s, c, 0, 0];
  },

  scale(sx: number, sy: number): Matrix {
    return [sx, 0, 0, sy, 0, 0];
  },

  inverse(m: Matrix): Matrix {
    const det = m[0] * m[3] - m[1] * m[2];
    if (Math.abs(det) < 1e-10) return Mat.identity();
    const inv = 1 / det;
    return [
       m[3] * inv,
      -m[1] * inv,
      -m[2] * inv,
       m[0] * inv,
      (m[2] * m[5] - m[3] * m[4]) * inv,
      (m[1] * m[4] - m[0] * m[5]) * inv,
    ];
  },

  applyToPoint(m: Matrix, p: Vec2): Vec2 {
    return {
      x: m[0] * p.x + m[2] * p.y + m[4],
      y: m[1] * p.x + m[3] * p.y + m[5],
    };
  },
};

/** Build world-space transform matrix for a node */
export function nodeMatrix(t: { x: number; y: number; width: number; height: number; rotation: number; scaleX: number; scaleY: number }): Matrix {
  const cx = t.x + t.width / 2;
  const cy = t.y + t.height / 2;
  return Mat.multiply(
    Mat.multiply(Mat.translate(cx, cy), Mat.rotate(t.rotation)),
    Mat.translate(-t.width / 2 * t.scaleX, -t.height / 2 * t.scaleY)
  );
}

export function rectContainsPoint(x: number, y: number, rx: number, ry: number, rw: number, rh: number): boolean {
  return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}

export function rectsOverlap(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Convert rotation degrees to a snap-friendly value */
export function snapAngle(deg: number, snap = 15): number {
  return Math.round(deg / snap) * snap;
}

export function snapToGrid(v: number, grid = 1): number {
  return Math.round(v / grid) * grid;
}

/** Check if point (px,py) is inside rotated rectangle defined by node transform */
export function hitTestRotatedRect(
  px: number, py: number,
  x: number, y: number, w: number, h: number, rotation: number
): boolean {
  const cx = x + w / 2, cy = y + h / 2;
  const r = (-rotation * Math.PI) / 180;
  const cos = Math.cos(r), sin = Math.sin(r);
  const lx = cos * (px - cx) - sin * (py - cy);
  const ly = sin * (px - cx) + cos * (py - cy);
  return Math.abs(lx) <= w / 2 && Math.abs(ly) <= h / 2;
}

/** Rotated ellipse hit test */
export function hitTestRotatedEllipse(
  px: number, py: number,
  x: number, y: number, w: number, h: number, rotation: number
): boolean {
  const cx = x + w / 2, cy = y + h / 2;
  const r = (-rotation * Math.PI) / 180;
  const cos = Math.cos(r), sin = Math.sin(r);
  const lx = cos * (px - cx) - sin * (py - cy);
  const ly = sin * (px - cx) + cos * (py - cy);
  const rx = w / 2, ry = h / 2;
  return (lx * lx) / (rx * rx) + (ly * ly) / (ry * ry) <= 1;
}

/**
 * Resizes a node with arbitrary rotation, preserving the opposite anchor in world space.
 * Correctly computes new (x, y, width, height) regardless of rotation angle!
 */
export function computeRotatedResize(
  initialTransform: { x: number; y: number; width: number; height: number; rotation: number },
  handle: 'tl' | 'tc' | 'tr' | 'ml' | 'mr' | 'bl' | 'bc' | 'br',
  pointerCanvasX: number,
  pointerCanvasY: number
): { x: number; y: number; width: number; height: number } {
  const { x, y, width: w0, height: h0, rotation } = initialTransform;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const cx0 = x + w0 / 2;
  const cy0 = y + h0 / 2;

  // Local offset of the opposite fixed point from original center
  let fixedLocalX = 0;
  let fixedLocalY = 0;

  switch (handle) {
    case 'tl': fixedLocalX =  w0 / 2; fixedLocalY =  h0 / 2; break; // fixed is br
    case 'tc': fixedLocalX =       0; fixedLocalY =  h0 / 2; break; // fixed is bc
    case 'tr': fixedLocalX = -w0 / 2; fixedLocalY =  h0 / 2; break; // fixed is bl
    case 'ml': fixedLocalX =  w0 / 2; fixedLocalY =       0; break; // fixed is mr
    case 'mr': fixedLocalX = -w0 / 2; fixedLocalY =       0; break; // fixed is ml
    case 'bl': fixedLocalX =  w0 / 2; fixedLocalY = -h0 / 2; break; // fixed is tr
    case 'bc': fixedLocalX =       0; fixedLocalY = -h0 / 2; break; // fixed is tc
    case 'br': fixedLocalX = -w0 / 2; fixedLocalY = -h0 / 2; break; // fixed is tl
  }

  // World coords of fixed point
  const fixedWorldX = cx0 + cos * fixedLocalX - sin * fixedLocalY;
  const fixedWorldY = cy0 + sin * fixedLocalX + cos * fixedLocalY;

  // Pointer vector relative to fixed point
  const vx = pointerCanvasX - fixedWorldX;
  const vy = pointerCanvasY - fixedWorldY;

  // Rotate into local coordinates (rotate by -rad)
  const localX = cos * vx + sin * vy;
  const localY = -sin * vx + cos * vy;

  let newW = w0;
  let newH = h0;
  let centerLocalFromFixedX = 0;
  let centerLocalFromFixedY = 0;

  switch (handle) {
    case 'br': {
      newW = Math.max(8, localX);
      newH = Math.max(8, localY);
      centerLocalFromFixedX = newW / 2;
      centerLocalFromFixedY = newH / 2;
      break;
    }
    case 'tl': {
      newW = Math.max(8, -localX);
      newH = Math.max(8, -localY);
      centerLocalFromFixedX = -newW / 2;
      centerLocalFromFixedY = -newH / 2;
      break;
    }
    case 'tr': {
      newW = Math.max(8, localX);
      newH = Math.max(8, -localY);
      centerLocalFromFixedX = newW / 2;
      centerLocalFromFixedY = -newH / 2;
      break;
    }
    case 'bl': {
      newW = Math.max(8, -localX);
      newH = Math.max(8, localY);
      centerLocalFromFixedX = -newW / 2;
      centerLocalFromFixedY = newH / 2;
      break;
    }
    case 'tc': {
      newH = Math.max(8, -localY);
      centerLocalFromFixedX = 0;
      centerLocalFromFixedY = -newH / 2;
      break;
    }
    case 'bc': {
      newH = Math.max(8, localY);
      centerLocalFromFixedX = 0;
      centerLocalFromFixedY = newH / 2;
      break;
    }
    case 'ml': {
      newW = Math.max(8, -localX);
      centerLocalFromFixedX = -newW / 2;
      centerLocalFromFixedY = 0;
      break;
    }
    case 'mr': {
      newW = Math.max(8, localX);
      centerLocalFromFixedX = newW / 2;
      centerLocalFromFixedY = 0;
      break;
    }
  }

  // Convert new center back to world space
  const newCx = fixedWorldX + cos * centerLocalFromFixedX - sin * centerLocalFromFixedY;
  const newCy = fixedWorldY + sin * centerLocalFromFixedX + cos * centerLocalFromFixedY;

  return {
    x: newCx - newW / 2,
    y: newCy - newH / 2,
    width: newW,
    height: newH,
  };
}
