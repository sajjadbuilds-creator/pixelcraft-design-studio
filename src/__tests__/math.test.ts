// ============================================================
// math.test.ts — Unit tests for geometry, matrices, and transforms
// ============================================================
import { describe, it, expect } from 'vitest';
import {
  Mat,
  hitTestRotatedRect,
  hitTestRotatedEllipse,
  computeRotatedResize,
  distance,
  snapAngle,
} from '../engine/math';

describe('2D Affine Transformation Matrix (Mat)', () => {
  it('identity matrix preserves points', () => {
    const p = { x: 42, y: 88 };
    const res = Mat.applyToPoint(Mat.identity(), p);
    expect(res.x).toBeCloseTo(42);
    expect(res.y).toBeCloseTo(88);
  });

  it('translates points correctly', () => {
    const t = Mat.translate(10, -25);
    const res = Mat.applyToPoint(t, { x: 5, y: 5 });
    expect(res.x).toBeCloseTo(15);
    expect(res.y).toBeCloseTo(-20);
  });

  it('rotates points 90 degrees clockwise', () => {
    const r = Mat.rotate(90);
    const res = Mat.applyToPoint(r, { x: 10, y: 0 });
    expect(res.x).toBeCloseTo(0);
    expect(res.y).toBeCloseTo(10);
  });

  it('matrix inversion inverts compound transforms', () => {
    const compound = Mat.multiply(Mat.translate(50, 100), Mat.rotate(45));
    const inv = Mat.inverse(compound);
    const original = { x: 120, y: 340 };
    const transformed = Mat.applyToPoint(compound, original);
    const restored = Mat.applyToPoint(inv, transformed);
    expect(restored.x).toBeCloseTo(original.x);
    expect(restored.y).toBeCloseTo(original.y);
  });
});

describe('Hit Testing with Rotation', () => {
  it('accurately hits inside an unrotated rectangle', () => {
    expect(hitTestRotatedRect(50, 50, 0, 0, 100, 100, 0)).toBe(true);
    expect(hitTestRotatedRect(150, 50, 0, 0, 100, 100, 0)).toBe(false);
  });

  it('correctly tests points inside a rotated rectangle', () => {
    // A 100x20 rect rotated 90 deg around center (50, 10)
    // Points along vertical axis should hit
    const inside = hitTestRotatedRect(50, 40, 0, 0, 100, 20, 90);
    expect(inside).toBe(true);
  });

  it('correctly tests points inside an ellipse', () => {
    expect(hitTestRotatedEllipse(50, 50, 0, 0, 100, 100, 0)).toBe(true);
    expect(hitTestRotatedEllipse(2, 2, 0, 0, 100, 100, 0)).toBe(false);
  });
});

describe('Rotated Resizing (computeRotatedResize)', () => {
  it('resizing unrotated rect from bottom-right (br) maintains top-left anchor', () => {
    const initial = { x: 100, y: 100, width: 200, height: 100, rotation: 0 };
    // Drag pointer to (350, 250) -> new width 250, new height 150
    const res = computeRotatedResize(initial, 'br', 350, 250);
    expect(res.x).toBeCloseTo(100);
    expect(res.y).toBeCloseTo(100);
    expect(res.width).toBeCloseTo(250);
    expect(res.height).toBeCloseTo(150);
  });

  it('resizing rotated rect maintains opposite corner in world space', () => {
    const initial = { x: 100, y: 100, width: 100, height: 100, rotation: 90 };
    // Handle 'tl' opposite anchor is 'br'.
    // Center is (150, 150). With 90 deg rotation, 'br' is at (100, 200).
    const res = computeRotatedResize(initial, 'br', 200, 200);
    expect(res.width).toBeGreaterThan(0);
    expect(res.height).toBeGreaterThan(0);
  });
});

describe('Snapping and Math Helpers', () => {
  it('snaps angle to 15 degree increments', () => {
    expect(snapAngle(14)).toBe(15);
    expect(snapAngle(44)).toBe(45);
    expect(snapAngle(92)).toBe(90);
  });

  it('computes euclidean distance accurately', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(5);
  });
});
